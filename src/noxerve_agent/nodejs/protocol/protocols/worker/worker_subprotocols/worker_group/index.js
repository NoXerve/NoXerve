/**
 * @file NoXerveAgent worker_group protocol file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroupProtocol
 * @description Subprotocol of worker. This module's "broadcast_request_response", "multicast_request_response" etc needs to be optimized specifically for worker group later after NoXerve become more matured. Since directly using APIs from worker protocol module costs a lot for a single tunnel connection.
 */

const Utils = require('../../../../../utils');
const Buf = require('../../../../../buffer');
const WorkerGroupManager = require('./manager');
const WorkerGroup = require('./worker_group');
const Errors = require('../../../../../errors');
const MaxGroupPeersCount = 128;

/**
 * @constructor module:WorkerGroupProtocol
 * @param {object} settings
 */

function WorkerGroupProtocol(settings) {
  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;
  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_protocol_actions = settings.worker_protocol_actions;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_group_manager = new WorkerGroupManager();

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_group_synchronization_dict = {};
}


/**
 * @memberof module:WorkerGroupProtocol
 * @type {object}
 * @private
 */
WorkerGroupProtocol.prototype._ProtocolCodes = {
  // sync_queue: Buf.from([0x00]),
};

/**
 * @callback module:WorkerGroupProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {module:WorkerGroupProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerGroupProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:WorkerGroupProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {module:WorkerGroupProtocol~callback_of_start} callback
 * @description Start running WorkerGroupProtocol.
 */
WorkerGroupProtocol.prototype.start = function(callback) {
  this._worker_group_manager.on('worker-group-create-request', (worker_group_purpose_name, group_peers_list, inner_callback) => {
    if (group_peers_list.length <= MaxGroupPeersCount) {
      let _tunnel_create_listener;

      const create_tunnel = (group_peer_id, create_tunnel_callback) => {
        const worker_group_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_group_purpose_name);
        const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
        const worker_peer_worker_id = group_peers_list[group_peer_id - 1];
        let _is_authenticity_valid = false;

        const synchronize_information = Buf.concat([
          // Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          worker_group_purpose_name_4bytes,
          my_worker_authenticity_bytes,
        ]);

        const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
          if(open_handshanke_error) {
            inner_callback(open_handshanke_error);
            return;
          }
          if(synchronize_acknowledgement_information[0] !== this._worker_global_protocol_codes.accept[0]) {
            inner_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('WorkerGroupProtocol create tunnel error. '));
            next(false);
            return;
          }
          const remote_worker_peer_authenticity_bytes = synchronize_acknowledgement_information.slice(1);
          this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
            _is_authenticity_valid = is_authenticity_valid;
            if (is_authenticity_valid && !error && remote_worker_peer_worker_id === worker_peer_worker_id) {
              next(this._worker_global_protocol_codes.accept); // Accept.
            } else {
              next(this._worker_global_protocol_codes.authentication_reason_reject_2_bytes); // Reject. Authenticication error.
            }
          });
        };

        const finish_handshake = (error, tunnel) => {
          if (error) {
            create_tunnel_callback(error);
          } else {
            if (_is_authenticity_valid) {
              create_tunnel_callback(error, tunnel);
            } else {
              create_tunnel_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Remote worker authentication failed.'));
            }
          }
        };
        this._worker_protocol_actions.openHandshakeByWorkerId(worker_peer_worker_id, synchronize_information, acknowledge_synchronization, finish_handshake);
      };

      const on_tunnel_create = (tunnel_create_listener) => {
        _tunnel_create_listener = tunnel_create_listener;
      };

      // Register this worker group synchronization action.
      this._worker_group_synchronization_dict[worker_group_purpose_name] = (synchronize_information, onError, onAcknowledge, next) => {
        const remote_worker_peer_authenticity_bytes = synchronize_information.slice(4);

        this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
          if (is_authenticity_valid && !error && group_peers_list.indexOf(remote_worker_peer_worker_id) !== -1) {
            onAcknowledge((acknowledge_information, tunnel) => {
              if (acknowledge_information[0] === this._worker_global_protocol_codes.accept[0]) {
                // Transfer worker id into group id.
                _tunnel_create_listener(group_peers_list.indexOf(remote_worker_peer_worker_id) + 1, tunnel);
              } else {
                tunnel.close();
              }
            });

            next(Buf.concat([
              this._worker_global_protocol_codes.accept, // Accept.
              this._worker_protocol_actions.encodeAuthenticityBytes()
            ]));
          } else {
            onAcknowledge((acknowledge_information, tunnel) => {
              // Reject.
              tunnel.close();
            });
            next(this._worker_global_protocol_codes.authentication_reason_reject_2_bytes); // Reject. Authenticication error.
          }
        });
      };

      const worker_group = new WorkerGroup({
        inactive_timeout_ms: -1,
        group_peers_list: group_peers_list,
        group_peers_count: group_peers_list.length,
        purpose_name: worker_group_purpose_name,
        create_tunnel: create_tunnel,
        on_tunnel_create: on_tunnel_create
      });

      worker_group.start((error)=> {
        inner_callback(error, worker_group);
      });
    } else {
      inner_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('GroupPeersList\'s length exceeds MaxGroupPeersCount ' + MaxGroupPeersCount + '.'));
    }
  });

  callback(false, this._worker_group_manager);
}

/**
 * @callback module:WorkerGroupProtocol~callback_of_next
 * @param {buffer} synchronize_returned_data
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {buffer} synchronize_information
 * @param {function} onError
 * @param {function} onAcknowledge
 * @param {module:WorkerGroupProtocol~callback_of_next} next
 * @description Synchronize handshake from remote emitter.
 */
WorkerGroupProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {
  const worker_group_purpose_name_4bytes = synchronize_information.slice(0, 4);
  const worker_group_purpose_name = this._hash_manager.stringify4BytesHash(worker_group_purpose_name_4bytes);
  if (this._worker_group_synchronization_dict[worker_group_purpose_name]) {
    this._worker_group_synchronization_dict[worker_group_purpose_name](synchronize_information, onError, onAcknowledge, next);
  } else {
    next(this._worker_global_protocol_codes.unknown_reason_reject_2_bytes);
  }
}

module.exports = {
  protocol_name: 'worker_group',
  protocol_code: Buf.from([0x02]),
  module: WorkerGroupProtocol
};

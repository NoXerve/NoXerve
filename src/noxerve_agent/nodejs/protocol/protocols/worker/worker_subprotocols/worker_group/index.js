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
  this._return_my_worker_id = settings.return_my_worker_id;

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
  this._global_deterministic_random_manager = settings.global_deterministic_random_manager;

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
  this._worker_group_manager.on('worker-group-create-request', (worker_group_purpose_name, group_peer_id_list, worker_group_create_request_callback) => {
    if(!group_peer_id_list.includes(this._return_my_worker_id())) {
      worker_group_create_request_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('GroupPeersList\'s must include yourself (with worker id: ' + this._return_my_worker_id() + ').'));
    }
    else if (group_peer_id_list.length <= MaxGroupPeersCount) {
      let _tunnel_create_listener;

      const create_tunnel = (group_peer_id, create_tunnel_callback) => {
        const worker_group_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_group_purpose_name);
        const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
        const worker_peer_worker_id = group_peer_id_list[group_peer_id - 1];

        const synchronize_message_bytes = Buf.concat([
          // Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          worker_group_purpose_name_4bytes,
          my_worker_authenticity_bytes,
        ]);

        const synchronize_error_handler = (synchronize_error) => {
          create_tunnel_callback(synchronize_error);
        };

        const synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
          if(synchronize_acknowledgment_message_bytes[0] !== this._worker_global_protocol_codes.accept[0]) {
            worker_group_create_request_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('WorkerGroupProtocol create tunnel error. '));
            acknowledge(false);
            return;
          }
          const remote_worker_peer_authenticity_bytes = synchronize_acknowledgment_message_bytes.slice(1);
          this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
            if (is_authenticity_valid && !error && remote_worker_peer_worker_id === worker_peer_worker_id) {
              acknowledge(this._worker_global_protocol_codes.accept, create_tunnel_callback); // Accept.
            } else {
              create_tunnel_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Remote worker authentication failed.'));
              acknowledge(this._worker_global_protocol_codes.authentication_reason_reject_2_bytes, (error, tunnel) => {
                tunnel.close();
              }); // Reject. Authenticication error.
            }
          });
        };
        this._worker_protocol_actions.synchronizeWorkerPeerByWorkerId(worker_peer_worker_id, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler);
      };

      const on_tunnel_create = (tunnel_create_listener) => {
        _tunnel_create_listener = tunnel_create_listener;
      };

      // Register this worker group synchronization action.
      this._worker_group_synchronization_dict[worker_group_purpose_name] = (synchronize_message_bytes, synchronize_acknowledgment) => {
        const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(4);

        this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
          if (is_authenticity_valid && !error && group_peer_id_list.indexOf(remote_worker_peer_worker_id) !== -1) {
            const acknowledge_handler = (acknowledge_message_bytes, tunnel) => {
              if (acknowledge_message_bytes[0] === this._worker_global_protocol_codes.accept[0]) {
                // Transfer worker id into group id.
                _tunnel_create_listener(group_peer_id_list.indexOf(remote_worker_peer_worker_id) + 1, tunnel);
              } else {
                tunnel.close();
              }
            };

            const synchronize_acknowledgment_error_handler = () => {};

            synchronize_acknowledgment(Buf.concat([
              this._worker_global_protocol_codes.accept, // Accept.
              this._worker_protocol_actions.encodeAuthenticityBytes()
            ]), synchronize_acknowledgment_error_handler, acknowledge_handler);
          } else {
            synchronize_acknowledgment(this._worker_global_protocol_codes.authentication_reason_reject_2_bytes, () => {}, (a, tunnel) => {tunnel.close();}); // Reject. Authenticication error.
          }
        });
      };

      const worker_group = new WorkerGroup({
        inactive_timeout_ms: -1,
        group_peer_id_list: group_peer_id_list,
        group_peers_count: group_peer_id_list.length,
        purpose_name: worker_group_purpose_name,
        create_tunnel: create_tunnel,
        on_tunnel_create: on_tunnel_create,
        hash_manager: this._hash_manager,
        nsdt_embedded_protocol: this._nsdt_embedded_protocol,
        global_deterministic_random_manager: this._global_deterministic_random_manager
      });

      worker_group.start((error)=> {
        worker_group_create_request_callback(error, worker_group);
      });
    } else {
      worker_group_create_request_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('GroupPeersList\'s length exceeds MaxGroupPeersCount ' + MaxGroupPeersCount + '.'));
    }
  });

  callback(false, this._worker_group_manager);
}

/**
 * @callback module:WorkerGroupProtocol~synchronize_acknowledgment
 * @param {buffer} synchronize_returned_data
 * @param {function} synchronize_acknowledgment_error_handler
 * @param {function} acknowledge_handler
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {buffer} synchronize_message_bytes
 * @param {module:WorkerGroupProtocol~synchronize_acknowledgment} synchronize_acknowledgment
 * @description Synchronize handshake from remote emitter.
 */
WorkerGroupProtocol.prototype.SynchronizeListener = function(synchronize_message_bytes, synchronize_acknowledgment) {
  const worker_group_purpose_name_4bytes = synchronize_message_bytes.slice(0, 4);
  const worker_group_purpose_name = this._hash_manager.stringify4BytesHash(worker_group_purpose_name_4bytes);
  if (this._worker_group_synchronization_dict[worker_group_purpose_name]) {
    this._worker_group_synchronization_dict[worker_group_purpose_name](synchronize_message_bytes, synchronize_acknowledgment);
  } else {
    synchronize_acknowledgment(this._worker_global_protocol_codes.unknown_reason_reject_2_bytes, ()=> {}, (a, tunnel)=> {tunnel.close();});
  }
}

module.exports = {
  protocol_name: 'worker_group',
  protocol_code: Buf.from([0x02]),
  module: WorkerGroupProtocol
};

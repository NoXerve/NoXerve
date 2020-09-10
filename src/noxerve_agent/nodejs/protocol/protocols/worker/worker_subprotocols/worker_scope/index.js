/**
 * @file NoXerveAgent WorkerScope file. [worker_scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerScope
 */

const Errors = require('../../../../../errors');
const MaxWorkerScopePeersCount = 512;
// const MaxWorkerScopePeersConnectionsCount = 512;

/**
 * @constructor module:WorkerScope
 * @param {object} settings
 * @description WorkerScope Object.
 */

function WorkerScope(settings) {
  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._settings = settings;

  this._scope_peers_settings = settings.scope_peers_settings;

  // /**
  //  * @memberof module:WorkerScope
  //  * @type {boolean}
  //  * @private
  //  */
  // this._complete = false;

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._scope_peers_connections_dict = {};

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'passively-close': () => {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if (close_handler) close_handler();
    },

    // // not complete. Such as a peer lose connection.
    // 'defect': () => {
    //
    // },

    'scope-socket-create': () => {

    },

    'data': (scope_id, data) => {

    },

    'request': (scope_id, data) => {

    },

  };

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
   this._my_scope_peer_id;
}

WorkerScope.prototype.multicastRequestResponse = function(scope_peer_id_list, data_bytes, on_a_worker_response, on_finish) {
}

WorkerScope.prototype.broadcastRequestResponse = function(data_bytes, on_a_worker_response, on_finish) {
}

WorkerScope.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// WorkerScope.prototype.joinPeer = function(worker_id, scope_peer_detail, callback) {
//   let scope_peer_id;
// }
//
// WorkerScope.prototype.updatePeer = function(scope_peer_id, scope_peer_detail, callback) {
//
// }
//
// WorkerScope.prototype.leavePeer = function(scope_peer_id, callback) {
//
// }

// Note that this synchronize is protocol's "synchronize". Not data synchronization.
WorkerScope.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {
  const scope_name_hash = synchronize_information.slice(0, 4);
  const scope_name_hash_base64 = scope_name_hash.toString('base64');
  const scope = this._base64_to_scope_dict[scope_name_hash_base64];

  if(scope) {
    const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(4, 8));
    const remote_worker_peer_authenticity_bytes = synchronize_information.slice(8, 8 + remote_worker_peer_authenticity_bytes_length);

    this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
      if (is_authenticity_valid) {
        const scope_synchronize_information = synchronize_information.slice(8 + remote_worker_peer_authenticity_bytes_length);
        const my_worker_authenticity_bytes = this._encodeAuthenticityBytes();

        const decorated_next = (synchronize_acknowledgement_information) => {
          next(Buf.concat([
            this._ProtocolCodes.worker_scope,
            this._ProtocolCodes.accept,
            Buf.encodeUInt32BE(my_worker_authentication_data_bytes.length),
            my_worker_authentication_data_bytes,
            synchronize_acknowledgement_information
          ]));
        };

        let error_listener;

        const decorated_on_acknowledge = (scope_listener) => {
          onAcknowledge((acknowledge_information, tunnel) => {
            if(acknowledge_information[0] === this._ProtocolCodes.worker_scope[0]) {
              if(acknowledge_information[1] === this._ProtocolCodes.accept) {
                scope_listener(acknowledge_information.slice(2), tunnel);
              }
              else if (acknowledge_information[1] === this._ProtocolCodes.reject) {
                if(acknowledge_information[2] === this._ProtocolCodes.unknown_reason_reject_2_bytes[1]) {
                  tunnel.close();
                  error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), null, () => {});
                }
                else if (acknowledge_information[2] === this._ProtocolCodes.authentication_reason_reject_2_bytes[1]) {
                  tunnel.close();
                  error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), null, () => {});
                }
                else {
                  tunnel.close();
                  error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), null, () => {});
                }
              }
              else {
                tunnel.close();
                error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), null, () => {});
              }
            }
            else {
              tunnel.close();
              error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'));
            }
          });
        };

        const decorated_on_error = (scope_listener) => {
          error_listener = scope_listener;
          onError(scope_listener);
        };

        scope.synchronize(scope_synchronize_information, decorated_on_error, decorated_on_acknowledge, decorated_next);
      }
      else {
        next(Buf.concat([
          this._ProtocolCodes.worker_scope,
          this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
        ]));
      }
    });
  } else next(Buf.concat([
    this._ProtocolCodes.worker_scope,
    this._ProtocolCodes.reject
  ]));
}

/**
 * @memberof module:WorkerScope
 * @param {string} event_name
 * @description WorkerScope events emitter. For internal uses.
 */
WorkerScope.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerScope;

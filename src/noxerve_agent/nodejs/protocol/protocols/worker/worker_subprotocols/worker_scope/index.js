/**
 * @file NoXerveAgent worker_scope protocol file. [worker_socket.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

 'use strict';

 /**
  * @module WorkerScopeProtocol
  * @description Subprotocol of worker. This module's "broadcast_request_response", "multicast_request_response" etc needs to be optimized specifically for worker scope later after NoXerve become more matured. Since directly using APIs from worker protocol module costs a lot for a single tunnel connection.
  */

const Utils = require('../../../../../utils');
const Buf = require('../../../../../buffer');
const WorkerScopeManager = require('./manager');
const WorkerScope = require('./worker_scope');
const Errors = require('../../../../../errors');
const MaxScopePeersCount = 128;

/**
 * @constructor module:WorkerScopeProtocol
 * @param {object} settings
 */

function WorkerScopeProtocol(settings) {
  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;
  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._worker_protocol_actions = settings.worker_protocol_actions;

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._worker_scope_manager = new WorkerScopeManager();

  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._worker_scopes_dict = {};
}


/**
 * @memberof module:WorkerScopeProtocol
 * @type {object}
 * @private
 */
WorkerScopeProtocol.prototype._ProtocolCodes = {
  integrity_check: Buf.from([0x00]),
  integrity_pass: Buf.from([0x01]),
  request_response: Buf.from([0x02]),
};

/**
 * @callback module:WorkerScopeProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeProtocol
 * @param {module:WorkerScopeProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerScopeProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:WorkerScopeProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeProtocol
 * @param {module:WorkerScopeProtocol~callback_of_start} callback
 * @description Start running WorkerScopeProtocol.
 */
WorkerScopeProtocol.prototype.start = function(callback) {
  this._worker_scope_manager.on('worker-scope-create-request', (worker_scpoe_purpose_name, scope_peers_list, inner_callback) => {
    const worker_scope_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_scpoe_purpose_name);
    const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();

    const worker_scope = new WorkerScope({
      worker_scpoe_purpose_name: worker_scpoe_purpose_name,
      scope_peers_list: scope_peers_list,
      broadcast_request_response: (data_bytes, on_a_worker_response, on_finish) => {
        const decorated_data_bytes = Buf.concat([
          this._ProtocolCodes.request_response,
          worker_scope_purpose_name_4bytes,
          data_bytes
        ]);
        this._worker_protocol_actions.multicastRequestResponse(scope_peers_list, );
      },
      multicast_request_response: (worker_ids_list, data_bytes, on_a_worker_response, on_finish) => {
        this._worker_protocol_actions.multicastRequestResponse(worker_ids_list);
      },
      check_integrity: (callback) => {
        const data_bytes = Buf.concat([
          this._ProtocolCodes.integrity_check,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          worker_scope_purpose_name_4bytes,
        ]);
        const on_a_worker_response = (worker_id, error, response_bytes, next) => {
          if(error) {
            next(error, false);
          }
          else if(response_bytes[0] === this._ProtocolCodes.integrity_check[0]) {
            if(response_bytes[1] !== this._worker_global_protocol_codes.accept[0]) {
              // error, is_finished
              next(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker(id: ' + worker_id + ') rejected or failed integrity check.'), false);
            }
            else {
              this._worker_protocol_actions.validateAuthenticityBytes(response_bytes.slice(2), (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
                if (is_authenticity_valid && !error) {
                  next(false, true);
                } else {
                  next(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker(id: ' + worker_id + ') failed "validateAuthenticityBytes" check.'), false);
                }
              });
            }
          }
          else {
            next(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker(id: ' + worker_id + ') did not return integrity_check code.'), false);
          }
        };
        const on_finish = (error) => {
          if(error) {
            callback(error);
          }
          else {
            callback(error);
            // Integrity passed. Broadcast integrity pass information.
          }
        };
        this._worker_protocol_actions.multicastRequestResponse(scope_peers_list, data_bytes, on_a_worker_response, on_finish);
      }
    });

    this._worker_scopes_dict[worker_scpoe_purpose_name] = worker_scope;
    inner_callback(false, worker_scope);
  });
  callback(false, this._worker_scope_manager);
}

/**
 * @memberof module:WorkerScopeProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerScopeProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {
  const protocol_code_int = synchronize_information[0];
  if(protocol_code_int === this._ProtocolCodes.integrity_check[0]) {
    onError((error) => {

    });
    const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));
    this._worker_protocol_actions.validateAuthenticityBytes(synchronize_information.slice(5, 5 + remote_worker_peer_authenticity_bytes_length), (error, is_authenticity_valid, remote_worker_peer_worker_id) => {

      if (is_authenticity_valid && !error) {
        const worker_scope_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_information.slice(5 + remote_worker_peer_authenticity_bytes_length, 5 + remote_worker_peer_authenticity_bytes_length + 4));
        if(this._worker_scopes_dict[worker_scope_purpose_name] && this._worker_scopes_dict[worker_scope_purpose_name].returnScopePeersList().includes(remote_worker_peer_worker_id)) {
          next(Buf.concat([
            this._ProtocolCodes.integrity_check,
            this._worker_global_protocol_codes.accept,
            this._worker_protocol_actions.encodeAuthenticityBytes()
          ])); // Reject. Authenticication error. (integrity failed)
        }
        else {
          next(Buf.concat([
            this._ProtocolCodes.integrity_check,
            this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
          ])); // Reject. Authenticication error. (integrity failed)
        }
      } else {
        next(Buf.concat([
          this._ProtocolCodes.integrity_check,
          this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
        ])); // Reject. Authenticication error.
      }
    });
  }
  else if(protocol_code_int === this._ProtocolCodes.request_response[0]) {

  }
  else {
    next(false);
  }
}

module.exports = {
  protocol_name: 'worker_scope',
  protocol_code: Buf.from([0x01]),
  module: WorkerScopeProtocol
};

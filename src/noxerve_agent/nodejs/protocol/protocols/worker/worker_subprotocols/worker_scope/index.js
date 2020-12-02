/**
 * @file NoXerveAgent worker_scope protocol file. [index.js]
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
  request_response: Buf.from([0x01])
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
  this._worker_scope_manager.on('worker-scope-create-request', (worker_scope_purpose_name, scope_peer_worker_id_list, inner_callback) => {
    const worker_scope_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_scope_purpose_name);
    const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();

    const worker_scope = new WorkerScope({
      worker_scope_purpose_name: worker_scope_purpose_name,
      scope_peer_worker_id_list: scope_peer_worker_id_list,
      request: (scope_peer_id, request_data_bytes, on_scope_peer_response) => {
        const target_worker_peer_worker_id = scope_peer_worker_id_list[scope_peer_id-1];
        const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
        const synchronize_message_bytes = Buf.concat([
          this._ProtocolCodes.request_response,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          worker_scope_purpose_name_4bytes,
          request_data_bytes
        ]);

        const synchronize_error_handler = (synchronize_error) => {
          on_scope_peer_response(synchronize_error);
        };

        const synchronize_acknowledgment_handler = (response_data_bytes, acknowledge) => {
          acknowledge(false);
          if(response_data_bytes[0] === this._ProtocolCodes.request_response[0]) {
            const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(response_data_bytes.slice(1, 5));
            const remote_worker_peer_authenticity_bytes = response_data_bytes.slice(5, 5 + remote_worker_peer_authenticity_bytes_length);
            this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
              if (is_authenticity_valid && !error) {
                const scope_peer_id = scope_peer_worker_id_list.indexOf(remote_worker_peer_worker_id) + 1;
                if(response_data_bytes[5 + remote_worker_peer_authenticity_bytes_length] !== this._worker_global_protocol_codes.accept[0]) {
                  // No scope_peer_id
                  on_scope_peer_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') rejected or failed integrity check.'));
                }
                else {
                  on_scope_peer_response(false, response_data_bytes.slice(5 + remote_worker_peer_authenticity_bytes_length + 1));
                }
              } else {
                on_scope_peer_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') failed "validateAuthenticityBytes" check.'));
              }
            });
          }
          else {
            on_scope_peer_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') did not return request_response code.'));
          }
        };
        this._worker_protocol_actions.synchronizeWorkerPeerByWorkerId(target_worker_peer_worker_id, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler);
      },
      broadcast_request: (data_bytes, a_scope_peer_response_listener, finished_listener, do_not_escape_if_error) => {
        const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
        const decorated_data_bytes = Buf.concat([
          this._ProtocolCodes.request_response,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          worker_scope_purpose_name_4bytes,
          data_bytes
        ]);
        const a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
          if(error) {
            a_scope_peer_response_listener(null, error, null, confirm_error_finish_status);
          }
          else if(response_data_bytes[0] === this._ProtocolCodes.request_response[0]) {
            const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(response_data_bytes.slice(1, 5));
            const remote_worker_peer_authenticity_bytes = response_data_bytes.slice(5, 5 + remote_worker_peer_authenticity_bytes_length);
            this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
              if (is_authenticity_valid && !error) {
                const scope_peer_id = scope_peer_worker_id_list.indexOf(remote_worker_peer_worker_id) + 1;
                if(response_data_bytes[5 + remote_worker_peer_authenticity_bytes_length] !== this._worker_global_protocol_codes.accept[0]) {
                  // No scope_peer_id
                  a_scope_peer_response_listener(scope_peer_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') rejected or failed integrity check.'), null, confirm_error_finish_status);
                }
                else {
                  a_scope_peer_response_listener(scope_peer_id, false, response_data_bytes.slice(5 + remote_worker_peer_authenticity_bytes_length + 1), confirm_error_finish_status);
                }
              } else {
                // No scope_peer_id
                a_scope_peer_response_listener(null, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') failed "validateAuthenticityBytes" check.'), null, confirm_error_finish_status);
              }
            });
          }
          else {
            // No scope_peer_id
            a_scope_peer_response_listener(null, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') did not return request_response code.'), null, confirm_error_finish_status);
          }
        };

        const decorated_finished_listener = (error, finished_worker_id_list) => {
          let finished_scope_peer_id_list = finished_worker_id_list.map((worker_id) => {
            return scope_peer_worker_id_list.indexOf(worker_id) + 1;
          });
          finished_listener(error, finished_scope_peer_id_list);
        };

        this._worker_protocol_actions.multicastRequest(scope_peer_worker_id_list, decorated_data_bytes, a_worker_response_listener, decorated_finished_listener, do_not_escape_if_error);
      },
      multicast_request: (scope_peer_id_list, data_bytes, a_scope_peer_response_listener, finished_listener, do_not_escape_if_error) => {
        let worker_id_list = [];

        // Translate scope_peer_id_list to worker_id_list.
        for(const index in scope_peer_id_list) {
          worker_id_list.push(scope_peer_worker_id_list[scope_peer_id_list[index]-1]);
        }

        const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
        const decorated_data_bytes = Buf.concat([
          this._ProtocolCodes.request_response,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          worker_scope_purpose_name_4bytes,
          data_bytes
        ]);
        const a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
          if(error) {
            a_scope_peer_response_listener(null, error, null, confirm_error_finish_status);
          }
          else if(response_data_bytes[0] === this._ProtocolCodes.request_response[0]) {
            const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(response_data_bytes.slice(1, 5));
            const remote_worker_peer_authenticity_bytes = response_data_bytes.slice(5, 5 + remote_worker_peer_authenticity_bytes_length);
            this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
              if (is_authenticity_valid && !error) {
                const scope_peer_id = scope_peer_worker_id_list.indexOf(remote_worker_peer_worker_id) + 1;
                if(response_data_bytes[5 + remote_worker_peer_authenticity_bytes_length] !== this._worker_global_protocol_codes.accept[0]) {
                  // No scope_peer_id
                  a_scope_peer_response_listener(scope_peer_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') rejected or failed integrity check.'), null, confirm_error_finish_status);
                }
                else {
                  a_scope_peer_response_listener(scope_peer_id, false, response_data_bytes.slice(5 + remote_worker_peer_authenticity_bytes_length + 1), confirm_error_finish_status);
                }
              } else {
                // No scope_peer_id
                a_scope_peer_response_listener(null, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') failed "validateAuthenticityBytes" check.'), null, confirm_error_finish_status);
              }
            });
          }
          else {
            // No scope_peer_id
            a_scope_peer_response_listener(null, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') did not return request_response code.'), null, confirm_error_finish_status);
          }
        };

        const decorated_finished_listener = (error, finished_worker_id_list) => {
          let finished_scope_peer_id_list = finished_worker_id_list.map((worker_id) => {
            return scope_peer_worker_id_list.indexOf(worker_id) + 1;
          });
          finished_listener(error, finished_scope_peer_id_list);
        };

        this._worker_protocol_actions.multicastRequest(worker_id_list, decorated_data_bytes, a_worker_response_listener, decorated_finished_listener, do_not_escape_if_error);
      },
      check_integrity: (callback) => {
        const data_bytes = Buf.concat([
          this._ProtocolCodes.integrity_check,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          worker_scope_purpose_name_4bytes,
        ]);
        const a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
          if(error) {
            confirm_error_finish_status(error, false);
          }
          else if(response_data_bytes[0] === this._ProtocolCodes.integrity_check[0]) {
            const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(response_data_bytes.slice(1, 5));
            const remote_worker_peer_authenticity_bytes = response_data_bytes.slice(5, 5 + remote_worker_peer_authenticity_bytes_length);
            this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
              if (is_authenticity_valid && !error) {
                if(response_data_bytes[5 + remote_worker_peer_authenticity_bytes_length] !== this._worker_global_protocol_codes.accept[0]) {
                  // error, is_finished
                  confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') rejected or failed integrity check.'), false);
                }
                else {
                  confirm_error_finish_status(false, true);
                }
              } else {
                console.log(is_authenticity_valid, error);
                confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') failed "validateAuthenticityBytes" check.'), false);
              }
            });
          }
          else {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') did not return integrity_check code.'), false);
          }
        };
        const finished_listener = (error) => {
          if(error) {
            callback(error);
          }
          else {
            callback(error);
            // Integrity passed. Broadcast integrity pass information.
          }
        };
        this._worker_protocol_actions.multicastRequest(scope_peer_worker_id_list, data_bytes, a_worker_response_listener, finished_listener);
      }
    });

    this._worker_scopes_dict[worker_scope_purpose_name] = worker_scope;
    inner_callback(false, worker_scope);
  });
  callback(false, this._worker_scope_manager);
}

/**
 * @callback module:WorkerScopeProtocol~synchronize_acknowledgment
 * @param {buffer} synchronize_returned_data
 * @param {function} synchronize_acknowledgment_error_handler
 * @param {function} acknowledge_handler
 */
/**
 * @memberof module:WorkerScopeProtocol
 * @param {buffer} synchronize_message_bytes
 * @param {module:WorkerScopeProtocol~synchronize_acknowledgment} synchronize_acknowledgment
 * @description Synchronize handshake from remote emitter.
 */
WorkerScopeProtocol.prototype.SynchronizeListener = function(synchronize_message_bytes, synchronize_acknowledgment) {
  const protocol_code_int = synchronize_message_bytes[0];
  const synchronize_acknowledgment_error_handler = (error) => {
    //console.log('sync_ack error: ' + error);
  }

  if(protocol_code_int === this._ProtocolCodes.integrity_check[0]) {
    const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(1, 5));
    this._worker_protocol_actions.validateAuthenticityBytes(synchronize_message_bytes.slice(5, 5 + remote_worker_peer_authenticity_bytes_length), (error, is_authenticity_valid, remote_worker_peer_worker_id) => {

      if (is_authenticity_valid && !error) {
        const worker_scope_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_message_bytes.slice(5 + remote_worker_peer_authenticity_bytes_length, 5 + remote_worker_peer_authenticity_bytes_length + 4));
        const worker_scope = this._worker_scopes_dict[worker_scope_purpose_name];
        const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
        if(worker_scope && worker_scope.returnScopePeerWorkerIdList().includes(remote_worker_peer_worker_id)) {
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.integrity_check,
            Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
            my_worker_authenticity_bytes,
            this._worker_global_protocol_codes.accept,
          ]), synchronize_acknowledgment_error_handler); // Accept
        }
        else {
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.integrity_check,
            Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
            my_worker_authenticity_bytes,
            this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
          ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error. (integrity failed)
        }
      } else {
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.integrity_check,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
        ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error.
      }
    });
  }
  else if(protocol_code_int === this._ProtocolCodes.request_response[0]) {
    // [flag] not sure if the sync_ack message is proper or not

    const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(1, 5));
    const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(5, 5 + remote_worker_peer_authenticity_bytes_length);

    this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {

      if (is_authenticity_valid && !error) {
        const worker_scope_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_message_bytes.slice(5 + remote_worker_peer_authenticity_bytes_length, 5 + remote_worker_peer_authenticity_bytes_length + 4));
        const worker_scope = this._worker_scopes_dict[worker_scope_purpose_name];
        const data_bytes = synchronize_message_bytes.slice(5 + remote_worker_peer_authenticity_bytes_length + 4);

        if(worker_scope && worker_scope.returnScopePeerWorkerIdList().includes(remote_worker_peer_worker_id)) {
          const response = (response_data_bytes) => {
            const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();
            synchronize_acknowledgment(Buf.concat([
              this._ProtocolCodes.request_response,
              Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
              my_worker_authenticity_bytes,
              this._worker_global_protocol_codes.accept,
              response_data_bytes?response_data_bytes:Buf.from([])
            ]), synchronize_acknowledgment_error_handler); // Accept
          };
          worker_scope.emitEventListener('request-response', worker_scope.returnScopePeerWorkerIdList().indexOf(remote_worker_peer_worker_id)+1 , data_bytes, response);
        }
        else {
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.request_response,
            Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
            my_worker_authenticity_bytes,
            this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
          ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error. (integrity failed)
        }
      } else {
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.request_response,
          Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
          my_worker_authenticity_bytes,
          this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
        ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error.
      }
    });
  }
  else {
    synchronize_acknowledgment(false);
  }
}

module.exports = {
  protocol_name: 'worker_scope',
  protocol_code: Buf.from([0x01]),
  module: WorkerScopeProtocol
};

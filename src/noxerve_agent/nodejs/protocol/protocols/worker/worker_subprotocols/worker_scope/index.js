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
  integrity_pass: Buf.from([0x01]),
  request_response: Buf.from([0x02]),
  add_worker: Buf.from([0x03]),
  remove_worker: Buf.from([0x04])
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

WorkerScopeProtocol.prototype._add_worker = function(worker_scope_purpose_name_4bytes, worker_peer_worker_ID) {
  let scope = this._worker_scopes_dict[worker_scope_purpose_name_4bytes];
  scope._scope_peer_list.push(worker_peer_worker_ID);
  scope._worker_list[Object.keys(scope._worker_list).length] = worker_peer_worker_ID;
  scope._event_listener_dict['worker_added'](worker_peer_worker_ID);
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
  this._worker_scope_manager.on('worker-scope-create-request', (worker_scope_purpose_name, scope_peer_list, inner_callback) => {
    const worker_scope_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_scope_purpose_name);
    const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();

    const worker_scope = new WorkerScope({
      worker_scope_purpose_name: worker_scope_purpose_name,
      scope_peer_list: scope_peer_list,
      broadcast_request: (data_bytes, a_worker_response_listener, finished_listener) => {
        const decorated_data_bytes = Buf.concat([
          this._ProtocolCodes.request_response,
          worker_scope_purpose_name_4bytes,
          data_bytes
        ]);
        this._worker_protocol_actions.multicastRequest(scope_peer_list, decorated_data_bytes, a_worker_response_listener, finished_listener);
      },
      multicast_request: (worker_id_list, data_bytes, a_worker_response_listener, finished_listener) => {
        this._worker_protocol_actions.multicastRequest(worker_id_list, data_bytes, a_worker_response_listener, finished_listener);
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
            if(response_data_bytes[1] !== this._worker_global_protocol_codes.accept[0]) {
              // error, is_finished
              confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') rejected or failed integrity check.'), false);
            }
            else {
              this._worker_protocol_actions.validateAuthenticityBytes(response_data_bytes.slice(2), (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
                if (is_authenticity_valid && !error) {
                  confirm_error_finish_status(false, true);
                } else {
                  confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_SCOPE('Worker(id: ' + worker_id + ') failed "validateAuthenticityBytes" check.'), false);
                }
              });
            }
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
        this._worker_protocol_actions.multicastRequest(scope_peer_list, data_bytes, a_worker_response_listener, finished_listener);
      },
      add_worker: (worker_peer_worker_ID, a_worker_response_listener, finished_listener) => {
        const decorated_data_bytes = Buf.concat([
          this._ProtocolCodes.add_worker,
          worker_scope_purpose_name_4bytes,
          Buf.encodeUInt32BE(worker_peer_worker_ID)
        ]);
        this._worker_protocol_actions.multicastRequest(scope_peer_list, decorated_data_bytes,
          a_worker_response_listener, finished_listener);
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
        if(this._worker_scopes_dict[worker_scope_purpose_name] && this._worker_scopes_dict[worker_scope_purpose_name].returnScopePeerList().includes(remote_worker_peer_worker_id)) {
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.integrity_check,
            this._worker_global_protocol_codes.accept,
            this._worker_protocol_actions.encodeAuthenticityBytes()
          ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error. (integrity failed)
        }
        else {
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.integrity_check,
            this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
          ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error. (integrity failed)
        }
      } else {
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.integrity_check,
          this._worker_global_protocol_codes.authentication_reason_reject_2_bytes
        ]), synchronize_acknowledgment_error_handler); // Reject. Authenticication error.
      }
    });
  }
  else if(protocol_code_int === this._ProtocolCodes.request_response[0]) {
    // [flag] not sure if the sync_ack message is proper or not
    synchronize_acknowledgment(Buf.concat([this._ProtocolCodes.request_response, this._worker_global_protocol_codes.worker_object]), synchronize_acknowledgment_error_handler);
  }
  else if(protocol_code_int === this._ProtocolCodes.add_worker[0]){
    // const remote_worker_peer_worker_id = synchronize_message_bytes.slice(2,2);
    const worker_scope_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_message_bytes.slice(1,5));
    if(!this._worker_scopes_dict[worker_scope_purpose_name])
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.add_worker,
        this._worker_global_protocol_codes.reject
      ]), synchronize_acknowledgment_error_handler);
      // reject. Request does not come from the worker inside the scope.
    else {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.add_worker,
        this._worker_global_protocol_codes.accept
      ]), synchronize_acknowledgment_error_handler);
      // accept.

      this._add_worker(worker_scope_purpose_name, Buf.decodeUInt32BE( synchronize_message_bytes.slice(5) ));
    }
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

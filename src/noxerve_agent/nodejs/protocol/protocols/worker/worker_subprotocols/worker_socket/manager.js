/**
 * @file NoXerveAgent worker_socket manager file. [manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerSocketManager
 * @description Worker socket subprotocol manager of worker.
 */

function WorkerSocketManager(settings) {
  /**
   * @memberof module:WorkerSocketManager
   * @type {object}
   * @private
   */
  this._event_listeners = {

  }
}

/**
 * @callback module:WorkerSocketManager~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:WorkerSocketManager
 * @param {buffer} register_code_1byte
 * @param {string} worker_socket_purpose_name
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
WorkerSocketManager.prototype.create = function(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback) {
  // The event is registered by protocols module.
  this._event_listeners['worker-socket-create-request'](worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback);
}

/**
 * @callback module:WorkerSocketManager~callback_of_on_worker_socket_create
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {object} worker_socket
 */
/**
 * @memberof module:WorkerSocketManager
 * @param {buffer} register_code_1byte
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {module:Worker~callback_of_on_worker_socket_create} listener
 * @description Handle worker socket emitted from remote worker.
 */
WorkerSocketManager.prototype.onCreate = function(worker_socket_purpose_name, listener) {
  this._event_listeners['worker-socket-create-' + worker_socket_purpose_name] = listener;
  // Register worker_socket_purpose_name.
  this._event_listeners['hash-string-request'](worker_socket_purpose_name);
}

/**
 * @callback module:WorkerSocketManager~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerSocketManager
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description WorkerSocketManager events.
 */
WorkerSocketManager.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @memberof module:WorkerSocketManager
 * @param {string} event_name
 * @description WorkerSocketManager events emitter. For internal uses.
 */
WorkerSocketManager.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerSocketManager;

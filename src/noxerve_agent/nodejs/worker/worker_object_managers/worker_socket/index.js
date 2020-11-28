/**
 * @file NoXerveAgent worker socket manager index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerSocketManager
 */

const Errors = require('../../../errors');
/**
 * @constructor module:WorkerSocketManager
 * @param {object} settings
 * @description NoXerve Agent WorkerSocketManager Object.
 */

function WorkerSocketManager(settings) {
  // /**
  //  * @memberof module:WorkerSocketManager
  //  * @type {buffer}
  //  */
  // this.worker_object_code = ;
  /**
   * @memberof module:WorkerSocketManager
   * @type {object}
   * @private
   */
  this._worker_subprotocol_object_managers = settings.worker_subprotocol_object_managers;
}

/**
 * @callback module:WorkerSocketManager~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:WorkerSocketManager
 * @param {string} worker_socket_purpose_name
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
WorkerSocketManager.prototype.create = function(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback) {
  this._worker_subprotocol_object_managers.worker_socket.create(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback);
}

/**
 * @callback module:WorkerSocketManager~callback_of_on_worker_socket_create
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {object} worker_socket
 */
/**
 * @memberof module:WorkerSocketManager
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {module:Worker~callback_of_on_worker_socket_create} listener
 * @description Handle worker socket emitted from remote worker.
 */
WorkerSocketManager.prototype.onCreate = function(worker_socket_purpose_name, listener) {
  this._worker_subprotocol_object_managers.worker_socket.onCreate(worker_socket_purpose_name, listener);
}

module.exports = {
  register_code: 0,
  module: WorkerSocketManager
};

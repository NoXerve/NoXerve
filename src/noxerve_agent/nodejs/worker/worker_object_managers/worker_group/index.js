/**
 * @file NoXerveAgent worker socket manager index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroupManager
 */

const Errors = require('../../../errors');
/**
 * @constructor module:WorkerGroupManager
 * @param {object} settings
 * @description NoXerve Agent WorkerGroupManager Object.
 */

function WorkerGroupManager(worker_subprotocol_object_managers) {
  // /**
  //  * @memberof module:WorkerGroupManager
  //  * @type {buffer}
  //  */
  // this.worker_object_code = ;
  /**
   * @memberof module:WorkerGroupManager
   * @type {object}
   * @private
   */
  this._worker_subprotocol_object_managers = worker_subprotocol_object_managers;
}

/**
 * @callback module:WorkerGroupManager~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupManager
 * @param {string} worker_socket_purpose_name
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
WorkerGroupManager.prototype.create = function(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback) {
  this._worker_subprotocol_object_managers.worker_socket.create(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback);
}


module.exports = {
  register_code: 2,
  module: WorkerGroupManager
};

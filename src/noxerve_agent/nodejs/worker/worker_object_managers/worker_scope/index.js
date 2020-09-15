/**
 * @file NoXerveAgent worker scope manager index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerScopeManager
 */

const Errors = require('../../../errors');
/**
 * @constructor module:WorkerScopeManager
 * @param {object} settings
 * @description NoXerve Agent WorkerScopeManager Object.
 */

function WorkerScopeManager(worker_subprotocol_object_managers) {
  // /**
  //  * @memberof module:WorkerScopeManager
  //  * @type {buffer}
  //  */
  // this.worker_object_code = ;
  /**
   * @memberof module:WorkerScopeManager
   * @type {object}
   * @private
   */
  this._worker_subprotocol_object_managers = worker_subprotocol_object_managers;
}

/**
 * @callback module:WorkerScopeManager~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeManager
 * @param {string} worker_socket_purpose_name
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
WorkerScopeManager.prototype.create = function(worker_scpoe_purpose_name, worker_peers_worker_ids_list, callback) {
  this._worker_subprotocol_object_managers.worker_scope.create(worker_scpoe_purpose_name, worker_peers_worker_ids_list, callback);
}

module.exports = {
  register_code: 1,
  module: WorkerScopeManager
};

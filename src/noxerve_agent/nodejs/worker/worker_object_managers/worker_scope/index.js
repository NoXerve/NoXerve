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
 * @callback module:WorkerScopeManager~callback_of_create
 * @param {object} worker_scope
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeManager
 * @param {string} worker_scope_purpose_name - The purpose for this worker scope.
 * @param {list} worker_peers_worker_id_list - The worker peers that you want to communicate with.
 * @param {module:Worker~callback_of_create} callback
 * @description Create a worker scope in order to communicate with another worker.
 */
WorkerScopeManager.prototype.create = function(worker_scope_purpose_name, worker_peers_worker_id_list, callback) {
  this._worker_subprotocol_object_managers.worker_scope.create(worker_scope_purpose_name, worker_peers_worker_id_list, callback);
}

module.exports = {
  register_code: 1,
  module: WorkerScopeManager
};

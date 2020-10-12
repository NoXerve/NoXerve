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
 * @callback module:WorkerGroupManager~callback_of_create
 * @param {object} worker_group
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupManager
 * @param {string} worker_group_purpose_name - The purpose for this worker group.
 * @param {list} worker_peers_worker_id_list - The worker peers that you want to communicate with.
 * @param {module:Worker~callback_of_create} callback
 * @description Create a worker group in order to communicate with another worker.
 */
WorkerGroupManager.prototype.create = function(worker_group_purpose_name, worker_peers_worker_id_list, callback) {
  this._worker_subprotocol_object_managers.worker_group.create(worker_group_purpose_name, worker_peers_worker_id_list, callback);
}


module.exports = {
  register_code: 2,
  module: WorkerGroupManager
};

/**
 * @file NoXerveAgent worker shoaling manager index file. [index.js]
 * @author idoleat <dppss92132@gmail.com>
 */

'use strict';

/**
 * @module WorkerShoalingManager
 */

const Errors = require('../../../errors');
/**
 * @constructor module:WorkerShoalingManager
 * @param {object} settings
 * @description NoXerve Agent WorkerShoalingManager Object.
 */
function WorkerShoalingManager(settings) {
  /**
   * @memberof module:WorkerShoalingManager
   * @type {object}
   * @private
   */
  this._worker_subprotocol_object_managers = settings.worker_subprotocol_object_managers;
}

/**
 * @callback module:WorkerShoalingManager~callback_of_create_worker_shoaling
 * @param {object} worker_shoaling
 * @param {error} error
 */
/**
 * @memberof module:WorkerShoalingManager
 * @param {string} worker_shoaling_purpose_name - The purpose for this worker shoaling.
 * @param {list} worker_peers_worker_id_list - The worker peers including in this shoaling.
 * @param {module:WorkerShoalingManager~callback_of_create_worker_shoaling} callback
 * @description Create a worker shoaling to communicate to a group of workers just like a worker.
 */
WorkerShoalingManager.prototype.create = function(worker_shoaling_purpose_name, worker_shoaling_peers_worker_id_list, callback){
  this._worker_subprotocol_object_managers.worker_shoaling.create(worker_shoaling_purpose_name, worker_shoaling_peers_worker_id_list, callback);
}

WorkerShoalingManager.prototype.onCreate = function(callback){
  this._worker_subprotocol_object_managers.worker_shoaling.onCreate(callback);
}

module.exports = {
  register_code: 4,
  module: WorkerShoalingManager
}

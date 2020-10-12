/**
 * @file NoXerveAgent worker_group manager file. [manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroupManager
 * @description Worker group subprotocol manager of worker.
 */

function WorkerGroupManager(settings) {
  /**
   * @memberof module:WorkerGroupManager
   * @type {object}
   * @private
   */
  this._event_listeners = {

  }
}

/**
 * @callback module:WorkerGroupManager~callback_of_create_worker_group
 * @param {object} worker_group
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupManager
 * @param {module:Worker~callback_of_create_worker_group} callback
 * @description Create a worker group in order to communicate with another worker.
 */
WorkerGroupManager.prototype.create = function(worker_scope_purpose_name, worker_peers_worker_id_list, callback) {
  // The event is registered by protocols module.
  this._event_listeners['worker-group-create-request'](worker_scope_purpose_name, worker_peers_worker_id_list, callback);
}

/**
 * @callback module:WorkerGroupManager~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerGroupManager
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description WorkerGroupManager events.
 */
WorkerGroupManager.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @memberof module:WorkerGroupManager
 * @param {string} event_name
 * @description WorkerGroupManager events emitter. For internal uses.
 */
WorkerGroupManager.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerGroupManager;

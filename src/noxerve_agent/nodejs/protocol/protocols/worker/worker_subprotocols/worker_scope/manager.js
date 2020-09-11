/**
 * @file NoXerveAgent worker_scope manager file. [manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerScopeManager
 * @description Worker socket subprotocol manager of worker.
 */

function WorkerScopeManager(settings) {
  /**
   * @memberof module:WorkerScopeManager
   * @type {object}
   * @private
   */
  this._event_listeners = {

  }
}

/**
 * @callback module:WorkerScopeManager~callback_of_create_worker_scope
 * @param {object} worker_scope
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeManager
 * @param {module:Worker~callback_of_create_worker_scope} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
WorkerScopeManager.prototype.create = function(worker_scpoe_purpose_name, worker_scope_purpose_parameter, worker_peers_worker_ids_list, callback) {
  // The event is registered by protocols module.
  this._event_listeners['worker-scope-create-request'](worker_scpoe_purpose_name, worker_scope_purpose_parameter, worker_peers_worker_ids_list, callback);
}

/**
 * @callback module:WorkerScopeManager~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerScopeManager
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description WorkerScopeManager events.
 */
WorkerScopeManager.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @memberof module:WorkerScopeManager
 * @param {string} event_name
 * @description WorkerScopeManager events emitter. For internal uses.
 */
WorkerScopeManager.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerScopeManager;

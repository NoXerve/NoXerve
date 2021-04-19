/**
 * @file NoXerveAgent worker shoaling manager index file. [index.js]
 * @author idoleat <dppss92132@gmail.com>
 */

'use strict';

/**
 * @module WorkerShoalingManager
 * @description Worker shoaling subprotocol manager. Responsable for the life cycle of worker shoaling object.
 */

function WorkerShoalingManager(){
  /**
   * @memberof module:WorkerShoalingManager
   * @type {Object}
   * @private
   */
  this._event_listener_dict = {};
}

/**
 * @callback module:WorkerShoalingManager~callback_of_create_worker_shoaling
 * @param {object} worker_shoaling
 * @param {error} error
 */
/**
 * @memberof module:WorkerShaolingManager
 * @param {string} worker_shoaling_purpose_name
 * @param {list} worker_peers_worker_id_list
 * @param {module:Worker~callback_of_create_worker_shoaling} callback
 * @description Called in the object manager. Trigger the 'worker-shoaling-create-request' event.
 */
WorkerShoalingManager.prototype.create = function(worker_shoaling_purpose_name, worker_peers_worker_id_list, callback){
  this._event_listener_dict['worker-shoaling-create-request'](worker_shoaling_purpose_name, worker_peers_worker_id_list, callback);
}

/**
 * @callback module:WorkerShoalingManager~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerShoalingManager
 * @param {string} event_name
 * @param {module:WorkerShoalingManager~callback_of_on} listener
 * @description WorkerShoalingManager events.
 */
WorkerShoalingManager.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @memberof module:WorkerShoalingManager
 * @param {string} event_name
 * @description WorkerShoalingManager events emitter. For internal uses.
 */
WorkerShoalingManager.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = WorkerShoalingManager;

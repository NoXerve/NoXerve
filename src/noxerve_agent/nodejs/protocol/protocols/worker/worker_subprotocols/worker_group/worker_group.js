/**
 * @file NoXerveAgent worker group file. [worker_group.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroup
 */

const Errors = require('../../../../../errors');
const Buf = require('../../../../../buffer');

/**
 * @constructor module:WorkerGroup
 * @param {object} settings
 * @description NoXerveAgent worker's WorkerGroup object.
 */


function WorkerGroup(settings) {
  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._group_peers_list = settings.group_peers_list;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._create_tunnel = settings.create_tunnel;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._event_listeners = {

    'connections-broken': () => {},

    'locker-create': () => {},
    'sync-queue-create': () => {},
    'async-queue-create': () => {},

    'locker-resume': () => {},
    'sync-queue-resume': () => {},
    'async-queue-resume': () => {},
  };
}

/**
 * @memberof module:WorkerGroupProtocol
 * @type {object}
 * @private
 */
WorkerGroup.prototype._ProtocolCodes = {
  locker: Buf.from([0x00]),
  sync_queue: Buf.from([0x01]),
  async_queue: Buf.from([0x02]),
};


WorkerGroup.prototype._sendToChannel = function(channel_8bytes, callback) {

}

// Locker
// create by a group peer
WorkerGroup.prototype.createLocker = function(locker_name, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeLocker = function(callback) {

}

// pause, destroy
// managed by Locker object itself.


// SyncQueue
// create by a group peer
WorkerGroup.prototype.createSyncQueue = function(callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeSyncQueue = function(callback) {

}

// pause, destroy
// managed by SyncQueue object itself.


// AyncQueue
// create by a group peer
WorkerGroup.prototype.createAyncQueue = function(callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeAyncQueue = function(callback) {

}

// pause, destroy
// managed by AyncQueue object itself.


WorkerGroup.prototype.destroy = function(callback) {

}

/**
 * @memberof module:WorkerGroup
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerGroup.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {

}

/**
 * @callback module:WorkerGroup~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:WorkerGroup
 * @param {string} event_name
 * @param {module:WorkerGroup~callback_of_on} callback
 * @description Register event listener.
 */
WorkerGroup.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @memberof module:WorkerGroup
 * @param {string} event_name
 * @description WorkerGroup events emitter. For internal uses.
 */
WorkerGroup.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerGroup;

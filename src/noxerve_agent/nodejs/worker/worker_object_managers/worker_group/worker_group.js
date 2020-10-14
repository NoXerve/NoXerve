const Locker = require('./objects/locker');
const SyncQueue = require('./objects/sync_queue');
const AsyncQueue = require('./objects/async_queue');

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
  this._group_peers_count = settings.group_peers_count;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._event_listener_dict = {

    'connections-broken': () => {},

    'locker-create': () => {},
    'sync-queue-create': () => {},
    'async-queue-create': () => {},

    'locker-resume': () => {},
    'sync-queue-resume': () => {},
    'async-queue-resume': () => {},
  };

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._active_locker_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._active_sync_queue_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._active_async_queue_dict = {};
}

// Locker
// create by a group peer
WorkerGroup.prototype.createLocker = function(locker_name, locker_parameter, callback) {
  // const locker = new Locker({
  //   locker_name: locker_name,
  //   locker_parameter: locker_parameter
  // });
}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeLocker = function(callback) {

}

// pause, destroy
// managed by Locker object itself.


// SyncQueue
// create by a group peer
WorkerGroup.prototype.createSyncQueue = function(sync_queue_name, sync_queue_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeSyncQueue = function(callback) {

}

// pause, destroy
// managed by SyncQueue object itself.


// AyncQueue
// create by a group peer
WorkerGroup.prototype.createAyncQueue = function(async_queue_name, async_queue_name_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeAyncQueue = function(callback) {

}

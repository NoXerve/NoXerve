/**
 * @file NoXerveAgent SyncQueue file. [locker_scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module SyncQueue
 */

const Errors = require('../../errors');

/**
 * @constructor module:SyncQueue
 * @param {object} settings
 * @description SyncQueue Object.
 */

function SyncQueue(settings) {
  /**
   * @memberof module:SyncQueue
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:SyncQueue
   * @type {object}
   * @private
   */
  this._event_listeners = {
  };
}

/**
 * @callback module:SyncQueue~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:SyncQueue
 * @param {string} event_name
 * @param {module:SyncQueue~callback_of_on} callback
 * @description Register event listener.
 */
SyncQueue.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @memberof module:SyncQueue
 * @param {string} event_name
 * @description SyncQueue events emitter. For internal uses.
 */
SyncQueue.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = SyncQueue;
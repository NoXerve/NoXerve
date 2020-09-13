/**
 * @file NoXerveAgent AsyncQueue file. [locker_scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module AsyncQueue
 */

const Errors = require('../../errors');

/**
 * @constructor module:AsyncQueue
 * @param {object} settings
 * @description AsyncQueue Object.
 */

function AsyncQueue(settings) {
  /**
   * @memberof module:AsyncQueue
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:AsyncQueue
   * @type {object}
   * @private
   */
  this._event_listeners = {
  };
}

/**
 * @callback module:AsyncQueue~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:AsyncQueue
 * @param {string} event_name
 * @param {module:AsyncQueue~callback_of_on} callback
 * @description Register event listener.
 */
AsyncQueue.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @memberof module:AsyncQueue
 * @param {string} event_name
 * @description AsyncQueue events emitter. For internal uses.
 */
AsyncQueue.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = AsyncQueue;

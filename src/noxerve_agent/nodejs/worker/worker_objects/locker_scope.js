/**
 * @file NoXerveAgent LockerScope file. [locker_scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module LockerScope
 */

const Errors = require('../../errors');

/**
 * @constructor module:LockerScope
 * @param {object} settings
 * @description LockerScope Object.
 */

function LockerScope(settings) {
  /**
   * @memberof module:LockerScope
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:LockerScope
   * @type {object}
   * @private
   */
  this._event_listeners = {
  };
}


/**
 * @memberof module:LockerScope
 * @param {string} event_name
 * @description LockerScope events emitter. For internal uses.
 */
LockerScope.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = LockerScope;

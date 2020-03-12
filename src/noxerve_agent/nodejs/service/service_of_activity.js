/**
 * @file NoXerveAgent service of activity file. [service_of_activity.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceOfActivity
 */

const Errors = require('../errors');

/**
 * @constructor module:ServiceOfActivity
 * @param {object} settings
 * @description NoXerve Agent Activity ServiceOfActivity Object.
 */

function ServiceOfActivity(settings) {
  /**
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Activity
   * @type {object}
   * @private
   */
  this._event_listeners = {};
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.emit = function(event_name, ...params) {
  this._event_listeners[event_name].apply(null, params);
}

module.exports = ServiceOfActivity;

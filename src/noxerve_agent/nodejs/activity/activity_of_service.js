/**
 * @file NoXerveAgent activity service api file. [activity_of_service.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ActivityOfService
 */

const Errors = require('../errors');

/**
 * @constructor module:ActivityOfService
 * @param {object} settings
 * @description NoXerve Agent Activity ActivityOfService Object.
 */

function ActivityOfService(settings) {
  /**
   * @memberof module:ActivityOfService
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
ActivityOfService.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// [Flag] Unfinished annotation.
ActivityOfService.prototype.emit = function(event_name, ...params) {
  this._event_listeners[event_name].apply(null, params);
}

module.exports = ActivityOfService;

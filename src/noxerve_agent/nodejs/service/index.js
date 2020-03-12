/**
 * @file NoXerveAgent service file. [service.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Service
 */

require('../errors');

/**
 * @constructor module:Service
 * @param {object} settings
 * @description NoXerve Agent Service Object. This module is a submodule hooked on NoXerveAgent object.
 */

function Service(settings) {
  /**
   * @memberof module:Service
   * @type {object}
   * @private
   */
  this._settings = settings;
};

/**
 * @callback module:Service~callback_of_on
 * @param {integer} activity_id
 * @param {error} error - Only exists with "error" event.
 */
/**
 * @memberof module:Service
 * @param {string} event_name - "connect", "error" or "close".
 * @param {module:Service~callback_of_on} callback
 * @description Service events. Each corresponded with an edvidual activity.
 */
Service.prototype.on = function(event_name, callback) {

}

/**
 * @callback module:Service~callback_of_redirect
 * @param {error} error
 */
/**
 * @memberof module:Service
 * @param {integer} activity_id
 * @param {integer} worker_id
 * @param {module:Service~callback_of_redirect} callback
 * @description Redirect activity for load balancing.
 */
Service.prototype.redirect = function(activity_id, worker_id, callback) {

}

// [Flag] Unfinished annotation.
// Alias of Service.define.
Service.prototype.def = this.define;

// [Flag] Unfinished annotation.
Service.prototype.define = function(function_name, callback) {

}

// [Flag] Unfinished annotation.
// activity_id is 8 bytes binary in base64 format.
Service.prototype.emit = function(activity_id, callback) {

}

module.exports = Service;

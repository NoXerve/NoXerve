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

const Errors = require('../../errors');

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
   * @memberof module:ActivityOfService
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'actvity-event-emit': ()=> {

    },
    'passively-close': ()=> {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if(close_handler) close_handler();
    }
  };

  /**
   * @memberof module:ActivityOfService
   * @type {object}
   * @private
   */
  this._activity_event_listeners = {};
}

// [Flag] Unfinished annotation.
ActivityOfService.prototype.close = function() {
  this._event_listeners['initiative-close']();
}

// [Flag] Unfinished annotation.
ActivityOfService.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// [Flag] Unfinished annotation.
ActivityOfService.prototype.startYielding = function(field_name, yielding_start_argument, yielding_start_callback) {
  this._event_listeners['yielding-start'](field_name, yielding_start_argument, yielding_start_callback);
}

// [Flag] Unfinished annotation.
ActivityOfService.prototype.call = function(service_function_name, service_function_argument, service_function_callback) {
  this._event_listeners['service-function-call'](service_function_name, service_function_argument, service_function_callback);
}

// [Flag] Unfinished annotation.
ActivityOfService.prototype.emitEventListener = function(event_name, ...params) {
  this._event_listeners[event_name].apply(null, params);
}

module.exports = ActivityOfService;

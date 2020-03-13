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

const Errors = require('../../errors');

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
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'service-function-call': (service_function_name, service_function_parameters, return_value, yield_value)=> {
      // return_value(error, NSDT), yield(NSDT)
      this._service_functions[service_function_name](service_function_parameters, return_value, yield_value);
    }
  };

  /**
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._service_functions = {};
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.emit = function(event_name, event_data) {
  this._event_listeners['actvity-event-emit'](event_name, event_data);
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.define = function(service_function_name, service_function) {
  this._service_functions[service_function_name] = service_function;
  this._event_listeners['service-function-define'](service_function_name);
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.emitEventListener = function(event_name, ...params) {
  this._event_listeners[event_name].apply(null, params);
}

module.exports = ServiceOfActivity;

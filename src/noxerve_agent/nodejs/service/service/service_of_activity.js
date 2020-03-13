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
   * @type {bool}
   * @private
   */
  this._closed = false;

  /**
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'service-function-call': (service_function_name, service_function_parameter, return_value, yield_value)=> {
      // return_value(error, NSDT), yield(NSDT)
      this._service_functions[service_function_name](service_function_parameter, return_value, yield_value);
    },
    'passively-close': ()=> {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if(close_handler) close_handler();
    },
    'yielding-start': (field_name, yielding_handler_parameter, ready_yielding)=> {
      this._yielding_handlers[field_name](yielding_handler_parameter, ready_yielding);
    }
  };

  /**
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._service_functions = {};

  /**
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._yielding_handlers = {};
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.close = function() {
  this._event_listeners['initiative-close']();
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// [Flag] Unfinished annotation.
ServiceOfActivity.prototype.handleYielding = function(field_name, yielding_handler) {
  this._yielding_handlers[field_name] = yielding_handler;
  this._event_listeners['yielding-handle'](field_name);

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

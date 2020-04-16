/**
 * @file NoXerveAgent service of activity file. [service_of_activity.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
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
   * @type {boolean}
   * @private
   */
  this._closed = false;

  /**
   * @memberof module:ServiceOfActivity
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'service-function-call-request': (service_function_name, service_function_parameter, return_value, yield_value) => {
      // return_value(error, NSDT), yield(NSDT)
      this._service_functions[service_function_name](service_function_parameter, return_value, yield_value);
    },
    'passively-close': () => {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if (close_handler) close_handler();
    },
    'yielding-start-request': (field_name, yielding_handler_parameter, ready_yielding) => {
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

/**
 * @callback module:ServiceOfActivity~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:ServiceOfActivity
 * @param {module:ServiceOfActivity~callback_of_close} callback
 * @description Close ServiceOfActivity.
 */
ServiceOfActivity.prototype.close = function(callback) {
  this._event_listeners['initiative-close'](callback);
}

/**
 * @callback module:ServiceOfActivity~callback_of_on
 * @description Parameters depends.
 */
/**
 * @memberof module:ServiceOfActivity
 * @param {string} event_name
 * @param {module:ServiceOfActivity~callback_of_on} callback
 * @description ServiceOfActivity events registeration.
 */
ServiceOfActivity.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @callback module:ServiceOfActivity~ready_yielding_callback
 * @param {error} error
 * @param {noxerve_supported_data_type} data
 * @param {boolean} end_of_file
 */
/**
 * @callback module:ServiceOfActivity~yielding_handler
 * @param {noxerve_supported_data_type} yielding_handler_parameter
 * @param {module:ServiceOfActivity~ready_yielding_callback} ready_yielding
 */
/**
 * @memberof module:ServiceOfActivity
 * @param {string} field_name
 * @param {module:ServiceOfActivity~yielding_handler} yielding_handler
 * @description ServiceOfActivity yield handler registeration. Handle yield from
 * activity to a specific field.
 */
ServiceOfActivity.prototype.handleYielding = function(field_name, yielding_handler) {
  this._yielding_handlers[field_name] = yielding_handler;
  this._event_listeners['yielding-handle'](field_name);

}

/**
 * @callback module:ServiceOfActivity~service_function
 * @param {noxerve_supported_data_type} service_function_parameter
 * @param {function} return_data
 * @param {function} yield_data
 */
/**
 * @memberof module:ServiceOfActivity
 * @param {string} service_function_name
 * @param {module:ServiceOfActivity~service_function} service_function
 * @description ServiceOfActivity service function registeration. Provide ability to stream data
 * from service to activity.
 */
ServiceOfActivity.prototype.define = function(service_function_name, service_function) {
  this._service_functions[service_function_name] = service_function;
  this._event_listeners['service-function-define'](service_function_name);
}

/**
 * @memberof module:ServiceOfActivity
 * @param {string} event_name
 * @description ServiceOfActivity events emitter. For internal uses.
 */
ServiceOfActivity.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = ServiceOfActivity;

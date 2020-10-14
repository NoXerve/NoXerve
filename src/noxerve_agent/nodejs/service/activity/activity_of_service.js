/**
 * @file NoXerveAgent activity service api file. [activity_of_service.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
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
  this._event_listener_dict = {
    'passively-close': () => {
      this._closed = true;
      const close_handler = this._event_listener_dict['close'];
      if (close_handler) close_handler();
    }
  };

  /**
   * @memberof module:ActivityOfService
   * @type {object}
   * @private
   */
  this._activity_event_listener_dict = {};
}

/**
 * @callback module:ActivityOfService~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:ActivityOfService
 * @param {module:ActivityOfService~callback_of_close} callback
 * @description Close ActivityOfService.
 */
ActivityOfService.prototype.close = function(callback) {
  this._event_listener_dict['initiative-close'](callback);
}

/**
 * @callback module:ActivityOfService~callback_of_on
 * @description Parameters depends.
 */
/**
 * @memberof module:ActivityOfService
 * @param {string} event_name
 * @param {module:ActivityOfService~callback_of_on} callback
 * @description ActivityOfService events registeration.
 */
ActivityOfService.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @callback module:ActivityOfService~callback_of_start_yielding
 * @param {error} error
 * @param {noxerve_supported_data_type} yielding_start_callback_parameter
 * @param {function} finish_yield
 * @param {function} yield_data
 */
/**
 * @memberof module:ActivityOfService
 * @param {string} field_name
 * @param {noxerve_supported_data_type} yielding_start_argument
 * @param {module:Service~callback_of_start_yielding} yielding_start_callback
 * @description ActivityOfService startYielding. Provide ability to stream data
 * from activity to service. Yielded data handled by service
 */
ActivityOfService.prototype.startYielding = function(field_name, yielding_start_argument, yielding_start_callback) {
  this._event_listener_dict['yielding-start'](field_name, yielding_start_argument, yielding_start_callback);
}

/**
 * @callback module:ActivityOfService~callback_of_call
 * @param {error} error
 * @param {noxerve_supported_data_type} service_function_return_data
 * @param {boolean} is_end_of_file
 */
/**
 * @memberof module:ActivityOfService
 * @param {string} service_function_name
 * @param {noxerve_supported_data_type} service_function_argument
 * @param {module:Service~callback_of_call} service_function_callback
 * @description ActivityOfService call. Call service function defined from service.
 */
ActivityOfService.prototype.call = function(service_function_name, service_function_argument, service_function_callback) {
  this._event_listener_dict['service-function-call'](service_function_name, service_function_argument, service_function_callback);
}

/**
 * @memberof module:ActivityOfService
 * @param {string} event_name
 * @description ActivityOfService events emitter. For internal uses.
 */
ActivityOfService.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = ActivityOfService;

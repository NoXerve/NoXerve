/**
 * @file NoXerveAgent service file. [service.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Service
 */

const Errors = require('../../errors');
const ServiceOfActivity = require('./service_of_activity');

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

  /**
   * @memberof module:Service
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    // Internal private default events.
    'service-of-activity-request': (callback) => {
      try {
        const service_of_activity = new ServiceOfActivity();
        callback(false, service_of_activity);
      } catch (error) {
        callback(error);
      }
    },
    'service-of-activity-purpose-exist': (activity_purpose_name) => {
      if (this._event_listener_dict['activity-create-' + activity_purpose_name]) {
        return true;
      } else {
        return false;
      }
    },
    'service-of-activity-ready': (activity_purpose_name, activity_purpose_parameter, service_of_activity) => {
      this._event_listener_dict['activity-create-' + activity_purpose_name](activity_purpose_parameter, service_of_activity);
    },
  };
};

/**
 * @callback module:Service~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:Service
 * @param {module:Service~callback_of_start} callback
 * @description Start the service module.
 */
Service.prototype.start = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Service~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Service
 * @param {module:Service~callback_of_close} callback
 * @description Close the service module.
 */
Service.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Service~callback_of_on
 * @param {error} error - Only exists with "error" event.
 */
/**
 * @memberof module:Service
 * @param {string} event_name - "connect", "error" or "close".
 * @param {module:Service~callback_of_on} callback
 * @description Service events registeration.
 */
Service.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @callback module:Service~callback_of_on_activity_create
 * @param {noxerve_supported_data_type} activity_purpose_parameter - The purpose for this activity. Along with it's parameter.
 * @param {object} service_of_activity
 */
/**
 * @memberof module:Service
 * @param {string} activity_purpose_name - The purpose for this activity.
 * @param {module:Service~callback_of_on_activity_create} listener
 * @description Handle activity emitted from remote.
 */
Service.prototype.onActivityCreate = function(activity_purpose_name, listener) {
  this._event_listener_dict['activity-create-' + activity_purpose_name] = listener;
  this._event_listener_dict['hash-string-request'](activity_purpose_name);
}

/**
 * @memberof module:Service
 * @param {string} event_name
 * @description Service events emitter.
 */
Service.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = Service;

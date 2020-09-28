/**
 * @file NoXerveAgent activity index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Activity
 */


const Errors = require('../../errors');
const ActivityOfService = require('./activity_of_service');


/**
 * @constructor module:Activity
 * @param {object} settings
 * @description NoXerve Agent Activity Object.
 */

function Activity(settings) {
  /**
   * @memberof module:Activity
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Activity
   * @type {object}
   * @private
   */
  this._event_listeners = {
    // Internal private default events.
    'activity-of-service-request': (callback) => {
      try {
        const activity_of_service = new ActivityOfService();
        callback(false, activity_of_service);
      } catch (error) {
        callback(error);
      }
    },
  };
}

/**
 * @callback module:Activity~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:Activity
 * @param {module:Activity~callback_of_start} callback
 * @description Start the activity module.
 */
Activity.prototype.start = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Activity~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Activity
 * @param {module:Activity~callback_of_close} callback
 * @description Close the activity module.
 */
Activity.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Activity~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:Activity
 * @param {string} event_name
 * @param {module:Activity~callback_of_on} callback
 * @description Activity events registeration.
 */
Activity.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @callback module:Activity~callback_of_create_activity
 * @param {error} error
 * @param {object} activity_of_service
 */
/**
 * @memberof module:Activity
 * @param {array} connector_settings_list
 * @param {string} activity_purpose_name
 * @param {noxerve_supported_data_type} activity_purpose_parameters
 * @param {module:Activity~callback_of_create_activity} callback
 * @description Activity events registeration.
 */
Activity.prototype.createActivity = function(connector_settings_list, activity_purpose_name, activity_purpose_parameters, callback) {
  this._event_listeners['activity-create'](connector_settings_list, activity_purpose_name, activity_purpose_parameters, callback);
}

/**
 * @memberof module:Activity
 * @param {string} event_name
 * @description Activity events emitter.
 */
Activity.prototype.emitEventListener = function(event_name, ...params) {
  this._event_listeners[event_name].apply(null, params);
}

module.exports = Activity;

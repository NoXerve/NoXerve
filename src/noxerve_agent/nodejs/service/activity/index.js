/**
 * @file NoXerveAgent activity index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
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
   this._event_listeners = {};
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
 * @param {array} interface_connect_settings_list
 * @param {module:Activity~callback_of_create_activity} callback
 * @description Activity events registeration.
 */
Activity.prototype.createActivity = function(interface_connect_settings_list, callback) {
  this._event_listeners['activity-create'](interface_connect_settings_list, (error, activity_of_service_handler)=> {
    if(error) {
      callback(error);
    }
    else {
      try {
        let activity_of_service = new ActivityOfService();

        // Setup service api.
        activity_of_service_handler(false, activity_of_service);

        // Finish up withour problem.
        callback(false, activity_of_service);
      }
      catch(error) {
        activity_of_service_handler(true);
        callback(error);
      }
    }
  });
}

module.exports = Activity;

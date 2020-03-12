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


const Errors = require('../../../errors');
const ServiceAPI = require('./service_api');


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

// [Flag] Unfinished annotation.
Activity.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}
// [Flag] Unfinished annotation.
Activity.prototype.createActivity = function(interface_connect_settings_list, callback) {
  this._event_listeners['create-activity'](interface_connect_settings_list, (error, service_api_handler)=> {
    if(error) {
      callback(error);
    }
    else {
      try {
        let service_api = new ServiceAPI();

        // Setup service api.
        service_api_handler(service_api);

        // Finish up withour problem.
        callback(false, service_api);
      }
      catch(error) {
        callback(error);
      }
    }
  });
}

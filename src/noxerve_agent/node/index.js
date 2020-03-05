/**
 * @file NoXerveAgent index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 // /**
 //  * @module NoXerveAgents
 //  */
'use strict';

/**
 * @module NoXerveAgent
 */

 /**
  * @class
  * @constructor
  * @param {object} settings
  * @description NoXerve Agent Object
  */

module.exports = function NoXerveAgent(settings) {
  /**
   * @memberof NoXerveAgent
   * @type {object}
   * @private
   */
  this._settings = settings;
};

/**
 * @memberof module:NoXerveAgent
 * @param {string} event_name
 * @param {function} callback
 */

NoXerveAgent.prototype.createPassiveInterface = function(event_name, callback) {

}

/**
 * @memberof module:NoXerveAgent
 * @type {object}
 * @description API intended to provide functions for the role of worker.
 * @namespace module:NoXerveAgent.Service
 */

NoXerveAgent.prototype.Service = {};

/**
 * @memberof module:NoXerveAgent.Service
 * @param {string} event_name - "connect", "error" or "close".
 * @param {module:NoXerveAgent.Service~callback_of_handle} callback
 */

NoXerveAgent.prototype.Service.handle = function(event_name, callback) {

}

/**
 * @callback module:NoXerveAgent.Service~callback_of_handle
 * @param {integer} ActivityId
 * @param {error} Error - Only exists with "error" event.
 */


/**
 * @memberof module:NoXerveAgent
 * @type {object}
 * @description API intended to provide functions for the role of worker.
 * @namespace module:NoXerveAgent.Worker
 */

NoXerveAgent.prototype.Worker = {};

/**
 * @memberof module:NoXerveAgent.Worker
 * @param {object} remote_passive_interfaces
 * @param {module:NoXerveAgent.Worker~callback_of_connect} callback
 * @description Connect to NoXerveAgent Worker Network
 */

NoXerveAgent.prototype.Worker.connect = function(remote_passive_interfaces, callback) {

}

/**
 * @callback module:NoXerveAgent.Worker~callback_of_connect
 * @param {number} responseCode
 * @param {string} responseMessage
 */

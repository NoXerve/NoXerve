/**
 * @file NoXerveAgent index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module NoXerveAgent
 */

Errors = require('./errors');
Worker = require('./worker');
Service = require('./service');


/**
 * @constructor module:NoXerveAgent
 * @param {object} settings
 * @description NoXerve Agent Object
 */
function NoXerveAgent(settings) {

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Worker
   * @description API intended to provide functions for the role of worker.
   */
  this.Worker = new Worker();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @description API intended to provide functions for the role of service.
   */
  this.Service = new Service();

};

/**
 * @callback module:NoXerveAgent~callback_of_create_passive_interface
 * @param {int} InterfaceId
 * @param {error} Error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {string} interface_type - 'TCP', 'Websocket', etc
 * @param {object} passive_interface_detail - port, crypto, etc
 * @param {callback_of_create_passive_interface} callback
 */
NoXerveAgent.prototype.createPassiveInterface = function(interface_type, passive_interface_detail, callback) {

}

/**
 * @callback module:NoXerveAgent~callback_of_destroy_passive_interface
 * @param {error} Error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {int} interface_id
 * @param {function} callback
 */
NoXerveAgent.prototype.destroyPassiveInterface = function(interface_id, callback) {

}

module.exports =  NoXerveAgent;

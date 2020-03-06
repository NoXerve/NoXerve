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

let Errors = require('./errors');
let Worker = require('./worker');
let Service = require('./service');
let Node = require('./node');



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

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Node
   * @private
   * @description Module for tunneling.
   */
  this._Node = new Node();
};

/**
 * @callback module:NoXerveAgent~callback_of_create_passive_interface
 * @param {int} interface_id
 * @param {error} error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {string} interface_type - 'TCP', 'Websocket', etc
 * @param {object} passive_interface_settings - port, crypto, etc
 * @param {callback_of_create_passive_interface} callback
 */
NoXerveAgent.prototype.createPassiveInterface = function(interface_type, passive_interface_settings, callback) {
  // This opreation handled by Node module.
  this._Node.createPassiveInterface(interface_type, passive_interface_settings, callback);
}

/**
 * @callback module:NoXerveAgent~callback_of_destroy_passive_interface
 * @param {error} error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {int} interface_id
 * @param {function} callback
 */
NoXerveAgent.prototype.destroyPassiveInterface = function(interface_id, callback) {
  // This opreation handled by Node module.
  this._Node.destroyPassiveInterface(interface_id, callback);
}

module.exports =  NoXerveAgent;

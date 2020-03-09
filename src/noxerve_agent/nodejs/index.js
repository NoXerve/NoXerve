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

const Errors = require('./errors');
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
   * @private
   * @description API intended to provide functions for the role of worker.
   */
  this._worker_module = new Worker();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @private
   * @description API intended to provide functions for the role of service.
   */
  this._service_module = new Service();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Node
   * @private
   * @description Module for tunneling.
   */
  this._node_module = new Node();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Worker
   * @description API intended to provide functions for the role of worker.
   */
  this.Worker = {

  };

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @description API intended to provide functions for the role of service.
   */
  this.Service = {

  };
};

/**
 * @callback module:NoXerveAgent~callback_of_create_interface
 * @param {int} interface_id
 * @param {error} error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {string} interface_name - 'TCP', 'Websocket', etc
 * @param {object} interface_settings - port, crypto, etc
 * @param {module:NoXerveAgent~callback_of_create_interface} callback
 */
NoXerveAgent.prototype.createInterface = function(interface_name, interface_settings, callback) {
  // This opreation handled by Node module.
  this._node_module.createInterface(interface_name, interface_settings, callback);
}

/**
 * @callback module:NoXerveAgent~callback_of_destroy_interface
 * @param {error} error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {int} interface_id
 * @param {module:NoXerveAgent~callback_of_destroy_interface} callback
 */
NoXerveAgent.prototype.destroyInterface = function(interface_id, callback) {
  // This opreation handled by Node module.
  this._node_module.destroyInterface(interface_id, callback);
}

/**
 * @callback module:NoXerveAgent~callback_of_close
 * @param {error} error
*/
/**
 * @memberof module:NoXerveAgent
 * @param {module:NoXerveAgent~callback_of_close} callback
 * @description Gracefully close NoXerveAgent.
 */
NoXerveAgent.prototype.close = function(interface_id, callback) {
  // Close tunnels first
  this._node_module.close(()=> {

  });
}

module.exports =  NoXerveAgent;

/**
 * @file NoXerveAgent secured node file. [secured_node.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module SecuredNode
 */

const Node = require('./index');

/**
 * @constructor module:SecuredNode
 * @param {object} settings
 * @description NoXerve Agent SecuredNode Object. Module that wrap node module and provide secured connection.
 */
function SecuredNode(settings) {
  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._settings = settings;


  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._node_module = new Node(settings);

  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   * @description Dictionary of event listeners.
   */
  this._event_listeners = {
    'tunnel-create': (tunnel) => {

    },

    'error': () => {

    }
  };
}

/**
 * @callback module:SecuredNode~callback_of_create_interface
 * @param {integer} interface_id
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {string} interface_name - "websocket", "tcp" or "websocket_secure".
 * @param {object} interface_settings
 * @param {module:SecuredNode~callback_of_create_interface} callback
 * @description Create interface via avaliable interfaces.
 */
SecuredNode.prototype.createInterface = function(interface_name, interface_settings, callback) {
  this._node_module.createInterface(interface_name, interface_settings, callback);
}

/**
 * @callback module:SecuredNode~callback_of_destroy_interface
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {string} interface_id - Which you've obtained from "createInterface".
 * @param {module:SecuredNode~callback_of_destroy_interface} callback
 * @description Destroy exists interface.
 */
SecuredNode.prototype.destroyInterface = function(interface_id, callback) {
  this._node_module.destroyInterface(interface_id, callback);
}

/**
 * @callback module:SecuredNode~callback_of_create_tunnel
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {string} interface_name,
 * @param {object} interface_connect_settings,
 * @param {module:SecuredNode~callback_of_create_tunnel} callback
 * @description Create tunnel via available interfaces.
 */
SecuredNode.prototype.createTunnel = function(interface_name, interface_connect_settings, callback) {

}

/**
 * @callback module:SecuredNode~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:SecuredNode
 * @param {string} event_name
 * @param {module:SecuredNode~callback_of_on} callback
 * @description Register event listener.
 */
SecuredNode.prototype.on = function(event_name, callback) {
  this._node_module.on(event_name, callback);
}

/**
 * @callback module:SecuredNode~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {module:SecuredNode~callback_of_start} callback
 * @description Start running node.
 */
SecuredNode.prototype.start = function(callback) {
  this._node_module.start(callback);
}

/**
 * @callback module:SecuredNode~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {module:SecuredNode~callback_of_close} callback
 * @description Close module.
 */
SecuredNode.prototype.close = function(interface_id, callback) {
  this._node_module.close(callback);
}

module.exports = SecuredNode;

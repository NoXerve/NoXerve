/**
 * @file NoXerveAgent interface file. [myself.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module MyselfInterface
 * @description Websocket submodule of interface module.
 * @memberof Node
 */

const Errors = require('../../errors');
const the_virtual_net = new (require('../virtualnet'))();

/**
 * @constructor
 * @param {object} settings
 * @description Passive interface of Websocket
 */
function Interface(settings, new_tunnel) {
  /**
   * @memberof Interface
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof Interface
   * @type {function}
   * @private
   */
  this._new_tunnel_function = new_tunnel;

  /**
   * @memberof Interface
   * @type {object}
   * @private
   * @description Dictionary of event listeners.
   */
  this._event_listener_dict = {};
}

/**
 * @callback Interface~callback_of_start
 * @param {error} error
 */
/**
 * @memberof Interface
 * @param {Interface~callback_of_start} callback
 * @description Start running interface.
 */
Interface.prototype.start = function(callback) {
  the_virtual_net.Server.on('connection', (socket) => {
    this._new_tunnel_function(
      // Wrapped send function.
      (data, send_callback) => {
        socket.send(data, send_callback);
      },
      // Wrapped close function.
      () => {
        socket.close();
      },
      // Get emitter and get the rest of jobs done.
      (error, tunnel_emitter) => {
        if (error) {
          console.log('MyselfInterface Interface error. ', error);
          // Emitter error event.
          this._event_listener_dict['error'](error);
        } else {
          socket.on('message', (message) => {
            tunnel_emitter('data', message);
          });

          socket.on('error', (error) => {
            tunnel_emitter('error', error);
          });

          socket.on('close', () => {
            tunnel_emitter('close');
          });
          tunnel_emitter('ready');
        }
      }
    );
  });
  callback(false);
}

/**
 * @callback Interface~callback_of_destroy
 * @param {error} error
 */
/**
 * @memberof Interface
 * @param {Interface~callback_of_destroy} callback
 * @description Destroy interface.
 */
Interface.prototype.destroy = function(callback) {
  the_virtual_net.Server.close(callback);
}

/**
 * @callback Interface~callback_of_on
 * @param {error} error
 * @description This callback might have additional parameters.
 */
/**
 * @memberof Interface
 * @param {string} event_name
 * @param {Interface~callback_of_on} callback
 * @description Register event listener.
 */
Interface.prototype.on = function(event_name, callback) {
  this._event_listener_dict[event_name] = callback;
}

/**
 * @constructor
 * @param {object} settings
 * @description Initiative interface of Websocket
 */
function Connector(settings) {
  /**
   * @memberof Connector
   * @type {object}
   * @private
   */
  this._settings = settings;
}

/**
 * @callback Connector~callback_of_connect
 * @param {error} error
 */
/**
 * @memberof Connector
 * @param {object} connect_settings
 * @param {Connector~callback_of_connect} callback
 * @description Register event listener.
 */
Connector.prototype.connect = function(connect_settings, new_tunnel_callback) {
  let socket_outside;
  // Call new_tunnel() function aquired from the function caller.
  new_tunnel_callback(
    // Wrapped send function.
    (data, callback) => {
      socket_outside.send(data, callback);
    },
    // Wrapped close function.
    () => {
      socket_outside.close();
    },
    // Get emitter and get the rest of jobs done.
    (error, tunnel_emitter) => {
      if (error) {
        console.log('MyselfInterface Connector error. ', error);
      } else {
        the_virtual_net.Client.connect((connect_error, socket) => {
          socket_outside = socket;
          if(connect_error) {
            tunnel_emitter('error', connect_error);
          }
          else {
            socket.on('message', (message) => {
              tunnel_emitter('data', message);
            });

            socket.on('close', () => {
              socket_outside = null;
              tunnel_emitter('close');
            });

            tunnel_emitter('ready');
          }
        });
      }
    }
  );
}

/**
 * @constructor
 * @param {object} settings
 * @description Initiative interface of Websocket
 */

module.exports = {
  /**
   * @memberof module:MyselfInterface
   * @type {Interface}
   */
  Interface: Interface,

  /**
   * @memberof module:MyselfInterface
   * @type {Connector}
   */
  Connector: Connector,

  /**
   * @memberof module:MyselfInterface
   * @type {string}
   */
  interface_name: 'myself',

  /**
   * @memberof module:MyselfInterface
   * @type {array}
   */
  interface_name_aliases: [
    'local',
    'MySelf',
    'me'
  ],

  /**
   * @memberof module:MyselfInterface
   * @type {integer}
   */
  interface_preference_level: 0,

  /**
   * @memberof module:MyselfInterface
   * @type {object}
   */
  interface_required_settings: {},

  /**
   * @memberof module:MyselfInterface
   * @type {boolean}
   */
  secured: true,

  /**
   * @memberof module:MyselfInterface
   * @type {object}
   */
  connector_required_settings: {}
}

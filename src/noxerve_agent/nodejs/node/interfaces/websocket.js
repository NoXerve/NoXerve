/**
 * @file NoXerveAgent interface file. [websocket.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module WebsocketInterface
 */

const WebSocket = require('ws');
const Errors = require('../../errors');

/**
 * @constructor
 * @param {object} settings
 * @description Passive interface of WebSocket
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
   * @type {bool}
   * @private
   * @description Indicate interface started or not.
   */
  this._started = false;

  /**
   * @memberof Interface
   * @type {bool}
   * @private
   * @description Indicate interface _closed or not.
   */
  this._closed = false;

  /**
   * @memberof Interface
   * @type {object}
   * @private
   * @description Dictionary of event listeners.
   */
  this._event_listeners = {
    'error': (error) => {

    }
  };
  /**
   * @memberof Interface
   * @type {object}
   * @private
   * @description WebSocket server instance.
   */
  this._server;
}

/**
 * @callback Interface~callback_of_start
 * @param {error} error
/**
 * @memberof Interface
 * @param {Interface~callback_of_start} callback
 * @description Start running interface.
 */
Interface.prototype.start = function(callback) {
  // Catch error.
  try {
    if (this._started || this._closed) {
      // [Flag] Uncatogorized Error.
      callback(true);
    } else {
      this._server = new WebSocket.Server({
        port: this._settings.port,
        host: this._settings.host
      });
      this._server.on('connection', (ws, req) => {
        // Call new_tunnel() function aquired from constructor(injected by node module).
        this._new_tunnel_function(
          // Wrapped send fucntion.
          (data, callback) => {
            ws.send(data, callback);
          },
          // Wrapped close fucntion.
          () => {
            ws.close();
          },
          // Get emitter and get the rest of jobs done.
          (error, tunnel_emitter) => {
            if (error) {
              // Emitter error event.
              this._event_listeners['error'](error);
            } else {
              ws.on('message', (message) => {
                tunnel_emitter('data', message);
              });

              ws.on('error', (error) => {
                tunnel_emitter('error', error);
              });

              ws.on('close', () => {
                tunnel_emitter('close');
              });
              tunnel_emitter('ready');
            }
          });
      });
      this._started = true;
      callback(false);
    }
  } catch (error) {
    callback(error);
  }
}

/**
 * @callback Interface~callback_of_destroy
 * @param {error} error
/**
 * @memberof Interface
 * @param {Interface~callback_of_destroy} callback
 * @description Destroy interface.
 */
Interface.prototype.destroy = function(callback) {
  // Catch error.
  try {
    // Close WebSocket Server.
    this._server.close((error) => {
      if (error) {
        callback(error);
      } else {
        this._closed = true;
        callback(false);
      }
    });
  } catch (error) {
    callback(error);
  }
}

/**
 * @callback Interface~callback_of_on
 * @param {error} error
 * @description This callback might have additional arguments.
/**
 * @memberof Interface
 * @param {string} event_name
 * @param {Interface~callback_of_on} callback
 * @description Register event listener.
 */
Interface.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @constructor
 * @param {object} settings
 * @description Initiative interface of WebSocket
 */
function Connector(settings, new_tunnel) {
  /**
   * @memberof Connector
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof Connector
   * @type {function}
   * @private
   */
  this._new_tunnel_function = new_tunnel;
}

/**
 * @callback Connector~callback_of_connect
 * @param {error} error
 * @description
/**
 * @memberof Connector
 * @param {object} connect_settings
 * @param {Connector~callback_of_connect} callback
 * @description Register event listener.
 */
Connector.prototype.connect = function(connect_settings, callback) {
  // Catch error.
  try {
    // Create a WebSocket client whatsoever.
    let ws = new WebSocket('ws://' + connect_settings.host + ':' + connect_settings.port);
    callback(false);

    // Call new_tunnel() function aquired from constructor(injected by node module).
    this._new_tunnel_function(
      // Wrapped send fucntion.
      (data, callback) => {
        ws.send(data, callback);
      },
      // Wrapped close fucntion.
      () => {
        ws.close();
      },
      // Get emitter and get the rest of jobs done.
      (error, tunnel_emitter) => {
        if (error) {
          // Emitter error event.
          callback(error);
        } else {
          ws.on('open', () => {
            tunnel_emitter('ready');
            // ws.send(123);
          });

          ws.on('message', (message) => {
            tunnel_emitter('data', message);
          });

          ws.on('error', (error) => {
            tunnel_emitter('error', error);
          });

          ws.on('close', () => {
            tunnel_emitter('close');
          });
          callback(error);
        }
      }
    );
  } catch (error) {
    callback(error);
  }
}

/**
 * @constructor
 * @param {object} settings
 * @description Initiative interface of WebSocket
 */

module.exports = {
  /**
   * @memberof module:WebsocketInterface
   * @type {Interface}
   */
  Interface: Interface,

  /**
   * @memberof module:WebsocketInterface
   * @type {Connector}
   */
  Connector: Connector,

  /**
   * @memberof module:WebsocketInterface
   * @type {string}
   */
  interface_name: 'websocket',

  /**
   * @memberof module:WebsocketInterface
   * @type {array}
   */
  interface_name_aliases: [
    'ws',
    'WebSocket'
  ],

  /**
   * @memberof module:WebsocketInterface
   * @type {object}
   */
  interface_required_settings: {
    host: 'IP address. Or other alternative addressing.',
    port: 'Port number.'
  },

  /**
   * @memberof module:WebsocketInterface
   * @type {object}
   */
  connector_required_settings: {},

  /**
   * @memberof module:WebsocketInterface
   * @type {object}
   */
  connector_connect_required_settings: {
    host: 'Remote IP address. Or other alternative addressing.',
    port: 'Remote port number.'
  }
}

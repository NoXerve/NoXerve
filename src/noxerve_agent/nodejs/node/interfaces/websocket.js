/**
 * @file NoXerveAgent interface file. [websocket.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WebsocketInterface
 * @description Websocket submodule of interface module.
 * @memberof Node
 */

const Websocket = require('ws');
const Errors = require('../../errors');

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
   * @type {boolean}
   * @private
   * @description Indicate interface started or not.
   */
  this._started = false;

  /**
   * @memberof Interface
   * @type {boolean}
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
  this._event_listener_dict = {
    'error': (error) => {

    }
  };
  /**
   * @memberof Interface
   * @type {object}
   * @private
   * @description Websocket server instance.
   */
  this._server;
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
  let called_callback = false;
  // Catch error.
  try {
    if (this._started || this._closed) {
      called_callback = true;
      callback(new Errors.ERR_NOXERVEAGENT_NODE_INTERFACE_START('Interface is either started or closed.'));
    } else {
      this._server = new Websocket.Server({
        port: this._settings.port,
        host: this._settings.host
      });
      this._server.on('connection', (ws, req) => {
        try {
          // Call new_tunnel() function aquired from constructor(injected by node module).
          this._new_tunnel_function(
            // Wrapped send function.
            (data, send_callback) => {
              ws.send(data, send_callback);
            },
            // Wrapped close function.
            () => {
              ws.close();
            },
            // Get emitter and get the rest of jobs done.
            (error, tunnel_emitter) => {
              if (error) {
                console.log('Websocket error. ', error);
                // Emitter error event.
                this._event_listener_dict['error'](error);
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
        } catch (error) {
          console.log(error);
        }
      });
      this._started = true;
      called_callback = true;
      callback(false);
    }
  } catch (error) {
    if (called_callback) throw error;
    else callback(error);
  }
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
  let called_callback = false;
  // Catch error.
  try {
    // Close Websocket Server.
    this._server.close((error) => {
      if (error) {
        called_callback = true;
        callback(error);
      } else {
        this._closed = true;
        called_callback = true;
        callback(false);
      }
    });
  } catch (error) {
    if (called_callback) throw error;
    else callback(error);
  }
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
  // // Catch error.
  // try {
  // Create a Websocket client whatsoever.
  let ws = new Websocket('ws://' + connect_settings.host + ':' + connect_settings.port, {handshakeTimeout: 2000});

  // Call new_tunnel() function aquired from the function caller.
  new_tunnel_callback(
    // Wrapped send function.
    (data, callback) => {
      ws.send(data, callback);
    },
    // Wrapped close function.
    () => {
      ws.close();
    },
    // Get emitter and get the rest of jobs done.
    (error, tunnel_emitter) => {
      if (error) {
        console.log('Websocket error. ', error);
      }
      else {
        ws.on('open', () => {
          tunnel_emitter('ready');
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
      }
    }
  );
  // } catch (error) {
  //   callback(error);
  // }
}

/**
 * @constructor
 * @param {object} settings
 * @description Initiative interface of Websocket
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
    'WebSocket',
    'Websocket'
  ],

  /**
   * @memberof module:WebsocketInterface
   * @type {integer}
   */
  interface_preference_level: 1,

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
   * @type {boolean}
   */
  secured: false,

  /**
   * @memberof module:WebsocketInterface
   * @type {object}
   */
  connector_required_settings: {
    host: 'Remote IP address. Or other alternative addressing.',
    port: 'Remote port number.'
  }
}

/**
 * @file NoXerveAgent interface file. [websocket.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

/**
 * @module WebsocketInterface
 */

const WebSocket = require('ws');
const Errors = require('../../errors');

/**
 * @constructor
 * @param {object} settings
 * @description Interface interface of WebSocket
 */
function Interface(settings) {
  /**
   * @memberof Interface
   * @type {object}
   * @private
   */
  this._settings = settings;

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
    'connect': (tunnel)=> {

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
 * @callback module:Interface~callback_of_start
 * @param {error} error
/**
 * @memberof module:Interface
 * @param {module:Service~callback_of_start} callback
 * @description Start running interface.
 */
Interface.prototype.start = function(callback) {
  // Catch error.
  try {
    if(this._started || this._closed) {
      // [Flag] Uncatogorized Error.
      callback(true);
    }
    else {
      this._server = new WebSocket.Server({port: this._settings.port, host: this._settings.host});
      this._server.on('connection', (ws, req) => {

      });
      this._started = true;
      callback(false);
    }
  }
  catch(error) {
    callback(error);
  }
}

/**
 * @callback module:Interface~callback_of_destroy
 * @param {error} error
/**
 * @memberof module:Interface
 * @param {module:Service~callback_of_destroy} callback
 * @description Destroy interface.
 */
Interface.prototype.destroy = function(callback) {
  // Catch error.
  try {
    // Close WebSocket Server.
    this._server.close((error)=> {
      if(error) {
        callback(error);
      }
      else {
        this._closed = true;
        callback(false);
      }
    });
  }
  catch(error) {
    callback(error);
  }
}

/**
 * @callback module:Interface~callback_of_on
 * @param {error} error
 * @description This callback might have additional arguments.
/**
 * @memberof module:Interface
 * @param {string} event_name
 * @param {module:Service~callback_of_on} callback
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
function Connector(settings) {
  /**
   * @memberof Interface
   * @type {object}
   * @private
   */
  this._settings = settings;
}


module.exports = {
  /**
   * @memberof module:WebsocketInterface
   * @type {Interface}
   */
  Interface: Interface,

  /**
   * @memberof module:WebsocketInterface
   * @type {Initiative}
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
  }
}

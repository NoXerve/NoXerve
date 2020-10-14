/**
 * @file NoXerveAgent tunnel file. [tunnel.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Tunnel
 */

const Errors = require('../errors');

/**
 * @constructor module:Tunnel
 * @param {string} tunnel_id
 * @description NoXerve Agent Node Tunnel Object. Submodule of interface module. Provide prototype of tunnel object.
 */
function Tunnel(settings) {
  /**
   * @memberof module:Tunnel
   * @type {object}
   * @private
   */
  this._settings = settings;

  if (!settings.close) {
    // Close method of socket is a nessasary setting.
    throw new Errors.ERR_NOXERVEAGENT_NODE_TUNNEL_SETTINGS('Close function is a nessasary setting of tunnel.');
  }
  /**
   * @memberof module:Tunnel
   * @type {function}
   * @private
   */
  this._close_function = settings.close;

  if (!settings.send) {
    // Send method of socket is a nessasary setting.
    throw new Errors.ERR_NOXERVEAGENT_NODE_TUNNEL_SETTINGS('Send function is a nessasary setting of tunnel.');
  }
  /**
   * @memberof module:Tunnel
   * @type {function}
   * @private
   */
  this._send_function = settings.send;

  /**
   * @memberof module:Tunnel
   * @type {object}
   * @private
   * @description Values is an object that store information along with specific
   * tunnel.
   */
  this._values = {};

  /**
   * @memberof module:Tunnel
   * @type {boolean}
   * @private
   * @description State if getemitter have been called or not.
   */
  this._emitter_distributed = false;

  /**
   * @memberof module:Tunnel
   * @type {object}
   * @private
   * @description Dictionary of event listeners.
   */
  this._event_listener_dict = {};

  /**
   * @memberof module:Tunnel
   * @type {array}
   * @private
   * @description Dictionary of event listeners.
   */
  this._required_event_emitters = ['ready', 'data', 'error', 'close'];

  /**
   * @memberof module:Tunnel
   * @type {array}
   * @private
   * @description Dictionary of event listeners.
   */
  this._emitter = (event_name, ...param) => {
    if (this._event_listener_dict[event_name]) {
      this._event_listener_dict[event_name].apply(null, param);
    }
  }
}

/**
 * @memberof module:Tunnel
 * @param {string} keyword
 * @param {object} value
 * @description Set specifiec value from keyword.
 */
Tunnel.prototype.setValue = function(keyword, value) {
  this._values[keyword] = value;
}

/**
 * @memberof module:Tunnel
 * @param {string} keyword
 * @description Remove specifiec value from keyword.
 */
Tunnel.prototype.removeValue = function(keyword) {
  delete this._values[keyword];
}

/**
 * @memberof module:Tunnel
 * @param {string} keyword
 * @returns {object} anything
 * @description Return specifiec value from keyword.
 */
Tunnel.prototype.returnValue = function(keyword) {
  return this._values[keyword];
}

/**
 * @callback module:Tunnel~callback_of_get_emitter
 * @param {error} error
 * @param {object} emitter
 */
/**
 * @memberof module:Tunnel
 * @param {module:Tunnel~callback_of_get_emitter} callback
 * @description Get emitter method. Designed for interface module to emit events.
 */
Tunnel.prototype.getEmitter = function(callback) {
  if (this._emitter_distributed) {
    callback(new Errors.ERR_NOXERVEAGENT_NODE_TUNNEL_GET_EMITTER('Emitter cannot be distributed twice.'));
  } else {
    callback(false, this._emitter);
    this._emitter_distributed = true;
  }
}

/**
 * @callback module:Tunnel~callback_of_on
 * @description Parameters are depended on event type.
 */
/**
 * @memberof module:Tunnel
 * @param {string} event_name
 * @param {module:Tunnel~callback_of_on} callback
 * @description On method. Designed for listening events.
 */
Tunnel.prototype.on = function(event_name, callback) {
  this._event_listener_dict[event_name] = callback;
}

/**
 * @callback module:Tunnel~callback_of_send
 * @param {error} error
 */
/**
 * @memberof module:Tunnel
 * @param {blob} data
 * @param {module:Tunnel~callback_of_send} callback
 * @description Send data. Blob data.
 */
Tunnel.prototype.send = function(blob, callback) {
  // console.log('tunnel send', blob); // Debug.
  this._send_function(blob, callback);
}

/**
 * @callback module:Tunnel~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Tunnel
 * @param {module:Tunnel~callback_of_close} callback
 * @description Close tunnel.
 */
Tunnel.prototype.close = function(callback) {
  this._close_function(callback);
}

module.exports = Tunnel;

/**
 * @file NoXerveAgent tunnel file. [tunnel.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Tunnel
 */

require('../errors');

/**
 * @constructor module:Tunnel
 * @param {string} tunnel_id
 * @description NoXerve Agent Node Tunnel Object
 */
function Tunnel(settings) {
  /**
   * @memberof module:Tunnel
   * @type {object}
   * @private
   */
  this._settings = settings;

  if(!settings.close) {
    // [Flag] Uncatogorized error.
    // Close method of socket is a nessasary setting.
    throw new Error();
  }
  /**
   * @memberof module:Tunnel
   * @type {function}
   * @private
   */
  this._close_function = settings.close;

  if(!settings.send) {
    // [Flag] Uncatogorized error.
    // Close method of socket is a nessasary setting.
    throw new Error();
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
   * @type {bool}
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
  this._event_listeners = {
  };

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
  this._emitter = (event_name, ...param)=> {
    this._event_listeners[event_name].apply(null, param);
  }
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.setValue = function(keyword, value) {
  this._values[keyword] = value;
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.removeValue = function(keyword) {
  delete this._values[keyword];
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.returnValue = function(keyword) {
  return this._values[keyword];
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.getEmitter = function(callback) {
  if(this._emitter_distributed) {
    // [Flag] Uncatogorized error.
    callback(true);
  }
  else {
    callback(false, this._emitter);
    this._emitter_distributed = true;
  }
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.send = function(blob, callback) {
  this._send_function(blob, callback);
}

// [Flag] Unfinished annotaion.
Tunnel.prototype.close = function(callback) {
  this._close_function(callback);
}

module.exports = Tunnel;

/**
 * @file NoXerveAgent channel file. [channel.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Channel
 */

const Errors = require('../../../../../errors');
const Buf = require('../../../../../buffer');

/**
 * @constructor module:Channel
 * @param {object} settings
 * @description NoXerveAgent worker group's Channel object.
 */


function Channel(settings) {
  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._send_to_group_peer = settings.send_to_group_peer;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._register_on_data = settings.register_on_data;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._unregister_on_data = settings.unregister_on_data;
}

Channel.prototype.ProtocolCodes = {
  onetime_data: Buf.from([0x00]),
  request_response: Buf.from([0x01]),
  handshake: Buf.from([0x01])
};
// Onetime data

// [Flag]
Channel.prototype.send = function(callback) {

}

// [Flag]
Channel.prototype.multicast = function(callback) {

}

// [Flag]
Channel.prototype.broadcast = function(callback) {

}

// [Flag]
Channel.prototype.onData = function(callback) {

}

// Request response

// [Flag]
Channel.prototype.requestResponse = function(callback) {

}

// [Flag]
Channel.prototype.multicastRequestResponse = function(callback) {

}

// [Flag]
Channel.prototype.broadcastRequestResponse = function(callback) {

}

// [Flag]
Channel.prototype.onRequestResponse = function(callback) {

}

// Handshake

// [Flag]
Channel.prototype.handshake = function(callback) {

}

// [Flag]
Channel.prototype.multicastHandShake = function(callback) {

}

// [Flag]
Channel.prototype.broadcastHandShake = function(callback) {

}

// [Flag]
Channel.prototype.onHandShake = function(callback) {

}

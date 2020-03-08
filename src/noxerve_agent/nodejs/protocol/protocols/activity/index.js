/**
 * @file NoXerveAgent activity protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 'use strict';

 /**
  * @module Protocol
  */

const Errors = require('../errors');

/**
 * @constructor module:ActivityProtocol
 * @param {object} settings
 * @description NoXerve ActivityProtocol Object. Protocols of activity module.
 */

function ActivityProtocol(settings) {
  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._module = settings.related_module;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   * @description Handshack function.
   */
  this.synchronize_function = settings.synchronize;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   * @description
   */
  this.open_handshake_function = settings.open_handshake;
}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.start = function() {

}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.close = function() {

}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.synchronize = function(synchronize_information) {
  // Activity doesn't support SYN.
  return false;
}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.acknowledgeSynchronization = function(synchronize_acknowledgement_information, tunnel) {

}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.acknowledge = function(acknowledge_information, tunnel) {
  // Activity doesn't support ACK.
  return false;
}

module.exports = ActivityProtocol;

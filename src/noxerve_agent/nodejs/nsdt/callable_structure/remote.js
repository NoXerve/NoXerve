/**
 * @file NoXerveAgent NoXerve Supported Data Type callable structure remote file. [remote.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */


'use strict';

/**
 * @module CallableStructureRemote
 */

/**
 * @constructor module:CallableStructureRemote
 * @param {object} settings
 * @description CallableStructure multiplexing and demultiplexing strutures

 */
function CallableStructureRemote(settings) {
  /**
   * @memberof module:CallableStructureRemote
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:CallableStructureRemote
   * @type {object}
   * @private
   */
  this._event_listener_dict = {};
}

// For nsdt protocol detecting.
/**
 * @memberof module:CallableStructureLocal
 * @description For nsdt protocol detecting.
 */
CallableStructureRemote.prototype.isCallableStructure = true;

/**
 * @memberof module:CallableStructureLocal
 * @description For nsdt protocol detecting.
 */
CallableStructureRemote.prototype.isRemoteCallableStructure = true;

CallableStructureRemote.prototype.call = function(function_name, ...params) {
  this._event_listener_dict['call'](function_name, params);
}

/**
 * @callback module:CallableStructureRemote~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:CallableStructureRemote
 * @param {string} event_name
 * @param {module:CallableStructureRemote~callback_of_on} callback
 * @description CallableStructureRemote events registeration.
 */
CallableStructureRemote.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @memberof module:CallableStructureRemote
 * @param {string} event_name
 * @description CallableStructureRemote events emitter.
 */
CallableStructureRemote.prototype.emitEventListener = function(event_name, ...params) {
  if(this._event_listener_dict[event_name]) {this._event_listener_dict[event_name].apply(null, params)};
}

module.exports = CallableStructureRemote;

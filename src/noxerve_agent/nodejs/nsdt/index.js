/**
 * @file NoXerveAgent NoXerve Supported Data Type index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module NSDT
 */

const CallableStructure = require('./callable_structure');
const Errors = require('../errors');
const Utils = require('../utils');

// NSTD cheatsheet
// Code | Type
// 0 blob
// 1 json
// 2 noxerve callback dictionary

/**
 * @constructor module:NSDT
 * @param {object} settings
 * @description NoXerve Supported Data Type module. Encode, Decode from and to
 * blob and supported data type.
 */
function NSDT(settings) {
  /**
   * @memberof module:NSDTErrors
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:NSDT
   * @type {object}
   * @private
   */
   this._event_listener_dict = {
     // 'callable-structure-local-request': ()=> {
     //
     // },
     'callable-structure-remote-request': ()=> {
       return new (CallableStructure.Remote)();
     }
   };
}

/**
 * @memberof module:NSDT
 * @description CallableStructure multiplexing and demultiplexing strutures
 * using one data channel.
 */
NSDT.prototype.createCallableStructure = function(name_to_function_dictionary, callback) {
  for(const index in name_to_function_dictionary) {
    if(typeof(name_to_function_dictionary[index]) !== 'function') {
      throw new Errors.ERR_NOXERVEAGENT_NSDT_CREATE_CALLABLE_STRUCTURE('Every value of your dictionary must be callable');
      return;
    }
  }
  return new (CallableStructure.Local)({
    name_to_function_dictionary: name_to_function_dictionary,
    id: Utils.random8Bytes()
  });
};

/**
 * @callback module:NSDT~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:NSDT
 * @param {string} event_name
 * @param {module:NSDT~callback_of_on} callback
 * @description NSDT events registeration.
 */
NSDT.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @memberof module:NSDT
 * @param {string} event_name
 * @description NSDT events emitter.
 */
NSDT.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = NSDT;

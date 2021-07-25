/**
 * @file NoXerveAgent NoXerve Supported Data Type callable structure local file. [local.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 */


'use strict';

/**
 * @module CallableStructureLocal
 */

/**
 * @constructor module:CallableStructureLocal
 * @param {object} settings
 * @description CallableStructure multiplexing and demultiplexing strutures

 */
function CallableStructureLocal(settings) {
  /**
   * @memberof module:CallableStructureLocal
   * @type {buffer}
   */
  this.Id = settings.id;
  /**
   * @memberof module:CallableStructureLocal
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:CallableStructureLocal
   * @type {object}
   * @private
   */
  this._name_to_function_dictionary = settings.name_to_function_dictionary;

  /**
   * @memberof module:CallableStructureLocal
   * @type {boolean}
   * @private
   */
  this._closed = false;

  /**
   * @memberof module:CallableStructureLocal
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    'call-request': (function_name, args) => {
      this._name_to_function_dictionary[function_name].apply(null, args);
    },
    'passively-close': () => {
      this._closed = true;
      const close_handler = this._event_listener_dict['close'];
      if (close_handler) close_handler();
    }
  };
}

/**
 * @memberof module:CallableStructureLocal
 * @description For nsdt protocol detecting.
 */
CallableStructureLocal.prototype.isCallableStructure = true;

/**
 * @memberof module:CallableStructureLocal
 * @description For nsdt protocol detecting.
 */
CallableStructureLocal.prototype.isLocalCallableStructure = true;

/**
 * @memberof module:CallableStructureLocal
 */
CallableStructureLocal.prototype.close = function() {
  this._event_listener_dict['initiative-close']();
};

/**
 * @memberof module:CallableStructureLocal
 * @return {array} function_name_list
 */
CallableStructureLocal.prototype.returnFunctionNameList = function() {
  return Object.keys(this._name_to_function_dictionary);
};

/**
 * @callback module:CallableStructureLocal~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:CallableStructureLocal
 * @param {string} event_name
 * @param {module:CallableStructureLocal~callback_of_on} callback
 * @description CallableStructureLocal events registeration.
 */
CallableStructureLocal.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @memberof module:CallableStructureLocal
 * @param {string} event_name
 * @description CallableStructureLocal events emitter.
 */
CallableStructureLocal.prototype.emitEventListener = function(event_name, ...params) {
  this._event_listener_dict[event_name].apply(null, params);
}

module.exports = CallableStructureLocal;

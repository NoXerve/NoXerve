/**
 * @file NoXerveAgent NoXerve Supported Data Type callbable structure local file. [local.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
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
}

CallableStructureLocal.prototype.close = function() {

};

module.exports = CallableStructureLocal;

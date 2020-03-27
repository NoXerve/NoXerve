/**
 * @file NoXerveAgent hash_manager file. [hash_manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module HashManager
 */

const Errors = require('../errors');
const Utils = require('../utils');


/**
 * @constructor module:HashManager
 * @param {object} settings
 * @description HashManager module. SubModule of ActivityProtocol.
 */
function HashManager(settings) {
  /**
   * @memberof module:HashManager
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:HashManager
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:HashManager
   * @type {object}
   * @private
   */
  this._hash_to_string = {};
}

/**
 * @memberof module:HashManager
 * @param {string} string
 * @private
 * @description For service function call.
 */
HashManager.prototype.hashString4Bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {
    result = Utils.hashString4BytesMd5(string);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:HashManager
 * @param {buffer} _4bytes_hash
 * @private
 * @description For service function call.
 */
HashManager.prototype.stringify4BytesHash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

module.exports = HashManager;

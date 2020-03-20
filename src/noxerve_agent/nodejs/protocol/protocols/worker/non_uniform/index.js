/**
 * @file NoXerveAgent non_uniform protocol index file. [non_uniform_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module NonUniformProtocol
 * @description Subprotocol of worker.
 */

const Utils = require('../../../../utils');
const Buf = require('../../../../buffer');
const NSDT = require('../../../../nsdt');
const Crypto = require('crypto');

/**
 * @constructor module:NonUniformProtocol
 * @param {object} settings
 */

function NonUniformProtocol(settings) {
  /**
   * @memberof module:NonUniformProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:NonUniformProtocol
   * @type {object}
   * @private
   */
  this._non_uniform_module = settings.non_uniform_module;

  /**
   * @memberof module:NonUniformProtocol
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:NonUniformProtocol
   * @type {object}
   * @private
   */
  this._hash_to_string = {};
}


/**
 * @memberof module:NonUniformProtocol
 * @type {object}
 * @private
 */
NonUniformProtocol.prototype._protocol_codes = {
};

/**
 * @memberof module:NonUniformProtocol
 * @param {string} string
 * @private
 * @description For service function call.
 */
NonUniformProtocol.prototype._hash_string_4bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {
    const hash_of_the_string = Crypto.createHash('md5');
    hash_of_the_string.update(string);
    result = hash_of_the_string.digest().slice(0, 4);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:NonUniformProtocol
 * @param {buffer} _4bytes_hash
 * @private
 * @description For service function call.
 */
NonUniformProtocol.prototype._stringify_4bytes_hash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

/**
 * @memberof module:NonUniformProtocol
 * @param {error} error - If service module create non_uniform failed or not.
 * @param {object} non_uniform
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
NonUniformProtocol.prototype.handleTunnel = function(remote_worker_id, tunnel) {
  console.log('remote_worker_id', remote_worker_id);
}

module.exports = NonUniformProtocol;

/**
 * @file NoXerveAgent resource protocol index file. [resource_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ResourceProtocol
 * @description Subprotocol of worker.
 */

const Utils = require('../../../../utils');
const Buf = require('../../../../buffer');
const NSDT = require('../../../../nsdt');
const Crypto = require('crypto');

/**
 * @constructor module:ResourceProtocol
 * @param {object} settings
 */

function ResourceProtocol(settings) {
  /**
   * @memberof module:ResourceProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ResourceProtocol
   * @type {object}
   * @private
   */
  this._resource_module = settings.resource_module;

  /**
   * @memberof module:ResourceProtocol
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:ResourceProtocol
   * @type {object}
   * @private
   */
  this._hash_to_string = {};
}


/**
 * @memberof module:ResourceProtocol
 * @type {object}
 * @private
 */
ResourceProtocol.prototype._protocol_codes = {
};

/**
 * @memberof module:ResourceProtocol
 * @param {string} string
 * @private
 * @description For service function call.
 */
ResourceProtocol.prototype._hash_string_4bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {
    const hash_sha256 = Crypto.createHash('md5');
    hash_sha256.update(string);
    result = hash_sha256.digest().slice(0, 4);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:ResourceProtocol
 * @param {buffer} _4bytes_hash
 * @private
 * @description For service function call.
 */
ResourceProtocol.prototype._stringify_4bytes_hash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

/**
 * @memberof module:ResourceProtocol
 * @param {error} error - If service module create resource failed or not.
 * @param {object} resource
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
ResourceProtocol.prototype.handleTunnel = function(remote_worker_id, tunnel) {
  console.log('remote_worker_id', remote_worker_id);
}

module.exports = ResourceProtocol;

/**
 * @file NoXerveAgent worker_socket protocol index file. [worker_socket.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerSocketProtocol
 * @description Subprotocol of worker.
 */

const Utils = require('../../../../utils');
const Buf = require('../../../../buffer');
const NSDT = require('../../../../nsdt');
const Crypto = require('crypto');

/**
 * @constructor module:WorkerSocketProtocol
 * @param {object} settings
 */

function WorkerSocketProtocol(settings) {
  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_socket_module = settings.worker_socket_module;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._hash_to_string = {};
}


/**
 * @memberof module:WorkerSocketProtocol
 * @type {object}
 * @private
 */
WorkerSocketProtocol.prototype._protocol_codes = {
};

/**
 * @memberof module:WorkerSocketProtocol
 * @param {string} string
 * @private
 * @description For service function call.
 */
WorkerSocketProtocol.prototype._hash_string_4bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {

    hash_of_the_string.update(string);
    result = hash_of_the_string.digest().slice(0, 4);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:WorkerSocketProtocol
 * @param {buffer} _4bytes_hash
 * @private
 * @description For service function call.
 */
WorkerSocketProtocol.prototype._stringify_4bytes_hash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

/**
 * @memberof module:WorkerSocketProtocol
 * @param {error} error - If service module create worker_socket failed or not.
 * @param {object} worker_socket
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
WorkerSocketProtocol.prototype.handleTunnel = function(remote_worker_id, tunnel) {
  console.log('remote_worker_id', remote_worker_id);
}

module.exports = WorkerSocketProtocol;

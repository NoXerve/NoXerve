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
}


/**
 * @memberof module:WorkerSocketProtocol
 * @type {object}
 * @private
 */
WorkerSocketProtocol.prototype._ProtocolCodes = {
};

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

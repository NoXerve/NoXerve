/**
 * @file NoXerveAgent worker_scope protocol file. [worker_socket.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

 'use strict';

 /**
  * @module WorkerScopeProtocol
  * @description Subprotocol of worker.
  */

const Utils = require('../../../../../utils');
const Buf = require('../../../../../buffer');

/**
 * @constructor module:WorkerScopeProtocol
 * @param {object} settings
 */

function WorkerScopeProtocol(settings) {
  /**
   * @memberof module:WorkerScopeProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;
}

/**
 * @callback module:WorkerScopeProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeProtocol
 * @param {module:WorkerScopeProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerScopeProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:WorkerScopeProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerScopeProtocol
 * @param {module:WorkerScopeProtocol~callback_of_start} callback
 * @description Start running WorkerScopeProtocol.
 */
WorkerScopeProtocol.prototype.start = function(callback) {
  callback(false);
}

/**
 * @memberof module:WorkerScopeProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerScopeProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {

}

module.exports = {
  protocol_name: 'worker_scope',
  protocol_code: Buf.from([0x01]),
  module: WorkerScopeProtocol
};

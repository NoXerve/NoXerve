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
const WorkerScopeManager = require('./manager');

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
  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_protocol_actions = settings.worker_protocol_actions;

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_scope_manager = new WorkerScopeManager();
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
  // this._worker_scope_manager.on('worker-scope-create-request', () => {
  //
  // });
  callback(false, this._worker_scope_manager);
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

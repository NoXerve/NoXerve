/**
 * @file NoXerveAgent worker shoaling manager index file. [index.js]
 * @author idoleat <dppss92132@gmail.com>
 */

'use strict';
 /**
  * @module WorkerShoalingProtocol
  * @description Subprotocol of worker. Interact with several workers just like interacting with one worker. [What is shoaling](https://en.wikipedia.org/wiki/Shoaling_and_schooling)
  */

const Utils = require('../../../../../utils');
const Buf = require('../../../../../buffer');
const WorkerShoalingManager = require('./manager');
const WorkerShoaling = require('./worker_shoaling');
const Errors = require('../../../../../errors');

/**
 * @constructor module:WorkerShoalingProtocol
 * @param {object} settings
 */

function WorkerShoalingProtocol(settings) {
  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {integer}
   * @private
   */
  this._my_worker_id = settings.my_worker_id;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._worker_protocol_actions = settings.worker_protocol_actions;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerShoalingProtocol
   * @type {object}
   * @private
   */
  this._worker_shoaling_manager = new WorkerShoalingManager();
}

WorkerShoalingProtocol.prototype.start = function(callback){
  this._worker_shoaling_manager.on('worker-shoaling-create-request', (worker_shoaling_purpose_name, worker_peers_worker_id_list, inner_callback) => {
    inner_callback(false, new WorkerShoaling({}));
  });
  callback(false, this._worker_shoaling_manager)
}

module.exports = {
  protocol_name: 'worker_shoaling',
  protocol_code: Buf.from([0x03]),
  module: WorkerShoalingProtocol
};

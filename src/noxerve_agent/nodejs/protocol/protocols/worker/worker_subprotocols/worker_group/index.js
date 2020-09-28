/**
 * @file NoXerveAgent worker_group protocol file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

 'use strict';

 /**
  * @module WorkerGroupProtocol
  * @description Subprotocol of worker. This module's "broadcast_request_response", "multicast_request_response" etc needs to be optimized specifically for worker group later after NoXerve become more matured. Since directly using APIs from worker protocol module costs a lot for a single tunnel connection.
  */

const Utils = require('../../../../../utils');
const Buf = require('../../../../../buffer');
const WorkerGroupManager = require('./manager');
const WorkerGroup = require('./worker_group');
const Errors = require('../../../../../errors');
const MaxGroupPeersCount = 128;

/**
 * @constructor module:WorkerGroupProtocol
 * @param {object} settings
 */

function WorkerGroupProtocol(settings) {
  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;
  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_protocol_actions = settings.worker_protocol_actions;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_group_manager = new WorkerGroupManager();

  /**
   * @memberof module:WorkerGroupProtocol
   * @type {object}
   * @private
   */
  this._worker_groups_dict = {};
}


/**
 * @memberof module:WorkerGroupProtocol
 * @type {object}
 * @private
 */
WorkerGroupProtocol.prototype._ProtocolCodes = {
  sync_queue: Buf.from([0x00]),
};

/**
 * @callback module:WorkerGroupProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {module:WorkerGroupProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerGroupProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:WorkerGroupProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {module:WorkerGroupProtocol~callback_of_start} callback
 * @description Start running WorkerGroupProtocol.
 */
WorkerGroupProtocol.prototype.start = function(callback) {
  this._worker_group_manager.on('worker-group-create-request', (worker_group_purpose_name, group_peers_list, inner_callback) => {
    if(group_peers_list.length <= MaxGroupPeersCount) {


      const worker_scope = new WorkerGroup({

      });

      this._worker_groups_dict[worker_group_purpose_name] = worker_group;
    }
    else {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('GroupPeersList\'s length exceeds MaxGroupPeersCount '+MaxGroupPeersCount+'.'));
    }
  });

  callback(false, this._worker_group_manager);
}

/**
 * @callback module:WorkerGroupProtocol~callback_of_next
 * @param {buffer} synchronize_returned_data
 */
/**
 * @memberof module:WorkerGroupProtocol
 * @param {buffer} synchronize_information
 * @param {function} onError
 * @param {function} onAcknowledge
 * @param {module:WorkerGroupProtocol~callback_of_next} next
 * @description Synchronize handshake from remote emitter.
 */
WorkerGroupProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {

}

module.exports = {
  protocol_name: 'worker_group',
  protocol_code: Buf.from([0x02]),
  module: WorkerGroupProtocol
};

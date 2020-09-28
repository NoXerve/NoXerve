/**
 * @file NoXerveAgent worker group file. [worker_group.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroup
 */

const Errors = require('../../../../../errors');

/**
 * @constructor module:WorkerGroup
 * @param {object} settings
 * @description NoXerveAgent worker's WorkerGroup object.
 */


function WorkerGroup(settings) {
  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._group_peers_list = settings.group_peers_list;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._create_tunnel = settings.create_tunnel;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._event_listeners = {
    request: () => {}
  };
}

/**
 * @callback module:WorkerGroup~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerGroup
 * @param {module:WorkerGroup~callback_of_start} callback
 * @description Start running WorkerGroup.
 */
WorkerGroup.prototype.start = function(callback) {
  let group_peers_connections_dict = {};
  // Initailize group peers' connections asynchronizely.
  const finish_a_connection_of_a_group_peer = (group_peer_id, error) => {

  };

  const worker_group_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_group_purpose_name);
  const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();

}

/**
 * @memberof module:WorkerGroup
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerGroup.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {

}

module.exports = WorkerGroup;

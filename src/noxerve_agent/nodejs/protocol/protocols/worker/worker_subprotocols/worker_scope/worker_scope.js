/**
 * @file NoXerveAgent worker scope file. [worker_scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerScope
 */

const Errors = require('../../../../../errors');

/**
 * @constructor module:WorkerScope
 * @param {object} settings
 * @description NoXerveAgent worker's WorkerScope object.
 */


function WorkerScope(settings) {
  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._max_concurrent_connections_count = settings.max_concurrent_connections_count;

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._create_tunnel = settings.create_tunnel;

  /**
   * @memberof module:WorkerScope
   * @type {object}
   * @private
   */
  this._event_listeners = {

  };
}

/**
 * @callback module:WorkerScope~callback_of_check_all_scope_peers_alive
 * @param {error} error
 */
/**
 * @memberof module:WorkerScope
 * @param {module:WorkerScope~callback_of_check_all_scope_peers_alive} callback
 * @description Check all peers alive by sending byte.
 */
WorkerScope.prototype.checkAllScopePeersAlive = function(callback) {
  this._event_listeners['all-scope-peers-alive-check'](callback);
}

/**
 * @callback module:WorkerScope~on_a_worker_response
 * @param {integer} worker_id
 * @param {error} error
 * @param {buffer} response_bytes
 * @param {function} next - arguments are "error" and "is_finished".
 */
/**
 * @callback module:WorkerScope~on_finish
 * @param {error} error
 * @param {list} finished_worker_id_list
 */
/**
 * @memberof module:WorkerScope
 * @param {list} worker_id_list
 * @param {buffer} data_bytes
 * @param {module:WorkerScope~on_a_worker_response} on_a_worker_response
 * @param {module:WorkerScope~on_finish} on_finish
 * @description Worker scope multicast request response.
 */
WorkerScope.prototype.multicastRequestResponse = function(worker_id_list, data_bytes, on_a_worker_response, on_finish) {
  this._event_listeners['all-scope-peers-alive-check'](worker_id_list, data_bytes, on_a_worker_response, on_finish);
}

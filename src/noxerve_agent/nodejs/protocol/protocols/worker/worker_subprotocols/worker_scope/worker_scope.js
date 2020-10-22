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
  this._scope_peer_list = settings.scope_peer_list;

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
  this._event_listener_dict = {
    request: () => {}
  };

  /**
	 * @memberof module:WorkerScopeProtocol
	 * @type {object}
	 * @private
	 */
	this._worker_list = {};
}

/**
 * Transfer the given workers to a labeled list starting from 0
 * @param  {Array} workers
 */
WorkerScope.prototype._CreateWorkerList = function(workers) {
	for (let i = 0; i < workers.length; i++) {
		this._worker_list[i] = workers[i];
	}
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
WorkerScope.prototype.checkIntegrity = function(callback) {
  this._settings.check_integrity(callback);
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
WorkerScope.prototype.returnScopePeerList = function() {
  return this._scope_peer_list;
}

/**
 * @callback module:WorkerScope~a_worker_response_listener
 * @param {integer} scope_peer_id
 * @param {error} error
 * @param {buffer} response_data_bytes
 * @param {function} next - parameters are "error" and "is_finished".
 */
/**
 * @callback module:WorkerScope~finished_listener
 * @param {error} error
 * @param {list} finished_scope_peer_id_list
 */
/**
 * @memberof module:WorkerScope
 * @param {list} scope_peer_id_list
 * @param {buffer} data_bytes
 * @param {module:WorkerScope~a_worker_response_listener} a_worker_response_listener
 * @param {module:WorkerScope~finished_listener} finished_listener
 * @description Worker scope multicast request response.
 */
WorkerScope.prototype.multicastRequestResponse = function(scope_peer_id_list, data_bytes, a_worker_response_listener, finished_listener) {
  this._settings.multicast_request_response(scope_peer_id_list, data_bytes, a_worker_response_listener, finished_listener);
}

/**
 * @callback module:WorkerScope~a_worker_response_listener
 * @param {integer} scope_peer_id
 * @param {error} error
 * @param {buffer} response_data_bytes
 * @param {function} next - parameters are "error" and "is_finished".
 */
/**
 * @callback module:WorkerScope~finished_listener
 * @param {error} error
 * @param {list} finished_scope_peer_id_list
 */
/**
 * @memberof module:WorkerScope
 * @param {buffer} data_bytes
 * @param {module:WorkerScope~a_worker_response_listener} a_worker_response_listener
 * @param {module:WorkerScope~finished_listener} finished_listener
 * @description Worker scope multicast request response.
 */
WorkerScope.prototype.broadcastRequestResponse = function(data_bytes, a_worker_response_listener, finished_listener) {
  this._settings.broadcast_request_response(data_bytes, a_worker_response_listener, finished_listener);
}

/**
 * @callback module:WorkerScope~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerScope
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description WorkerScope events.
 */
WorkerScope.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @memberof module:WorkerScope
 * @param {string} event_name
 * @description WorkerScope events emitter. For internal uses.
 */
WorkerScope.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = WorkerScope;

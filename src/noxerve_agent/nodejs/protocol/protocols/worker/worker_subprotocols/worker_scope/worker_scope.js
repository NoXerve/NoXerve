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
  this._scope_peers_list = settings.scope_peers_list;

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
    request: () => {}
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
WorkerScope.prototype.returnScopePeersList = function() {
  return this._scope_peers_list;
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
 * @param {list} finished_worker_ids_list
 */
/**
 * @memberof module:WorkerScope
 * @param {list} worker_ids_list
 * @param {buffer} data_bytes
 * @param {module:WorkerScope~on_a_worker_response} on_a_worker_response
 * @param {module:WorkerScope~on_finish} on_finish
 * @description Worker scope multicast request response.
 */
WorkerScope.prototype.multicastRequestResponse = function(worker_ids_list, data_bytes, on_a_worker_response, on_finish) {
  this._settings.multicast_request_response(worker_ids_list, data_bytes, on_a_worker_response, on_finish);
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
 * @param {list} finished_worker_ids_list
 */
/**
 * @memberof module:WorkerScope
 * @param {list} worker_ids_list
 * @param {buffer} data_bytes
 * @param {module:WorkerScope~on_a_worker_response} on_a_worker_response
 * @param {module:WorkerScope~on_finish} on_finish
 * @description Worker scope multicast request response.
 */
WorkerScope.prototype.broadcastRequestResponse = function(data_bytes, on_a_worker_response, on_finish) {
  this._settings.broadcast_request_response(data_bytes, on_a_worker_response, on_finish);
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
  this._event_listeners[event_name] = listener;
}

/**
 * @memberof module:WorkerScope
 * @param {string} event_name
 * @description WorkerScope events emitter. For internal uses.
 */
WorkerScope.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerScope;

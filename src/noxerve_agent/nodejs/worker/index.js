/**
 * @file NoXerveAgent worker index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Worker
 */

const Errors = require('../errors');
const WorkerSocket = require('./worker_objects/worker_socket');
const GlobalDeterministicRandomManager = require('./global_deterministic_random_manager');

/**
 * @constructor module:Worker
 * @param {object} settings
 * @description NoXerve Agent Worker Object. This module is a submodule hooked on NoXerveAgent object.
 */
function Worker(settings) {
  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._event_listeners = {
    // Internal private default events.
    'worker-socket-request': (callback) => {
      try {
        const worker_socket = new WorkerSocket();
        callback(false, worker_socket);
      } catch (error) {
        console.log(error);
        callback(error);
      }
    },
    'global-deterministic-random-manager-request': (static_global_random_seed_4096bytes, callback) => {
      try {
        const global_deterministic_random_manager = new GlobalDeterministicRandomManager({
          static_global_random_seed_4096bytes: static_global_random_seed_4096bytes
        });
        callback(false, global_deterministic_random_manager);
      } catch (error) {
        console.log(error);
        callback(error);
      }
    },
    'worker-peer-authentication': (worker_id, worker_authenticity_information, is_valid) => {
      is_valid(false);
    },
    'worker-socket-ready': (worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, worker_socket) => {
      this._event_listeners['worker-socket-create-' + worker_socket_purpose_name](worker_socket_purpose_parameter, remote_worker_id, worker_socket);
    },
    'worker-peer-join-request': (remote_worker_id, worker_peer_interfaces_connect_settings, worker_peer_detail, next) => {
      this._event_listeners['worker-peer-join'](remote_worker_id, worker_peer_interfaces_connect_settings, worker_peer_detail, next);
    },
    'worker-peer-update-request': (remote_worker_id, worker_peer_interfaces_connect_settings, worker_peer_detail, next) => {
      this._event_listeners['worker-peer-update'](remote_worker_id, worker_peer_interfaces_connect_settings, worker_peer_detail, next);
    },
    'worker-peer-leave-request': (remote_worker_id, next) => {
      this._event_listeners['worker-peer-leave'](remote_worker_id, next);
    },

    // Required listener default setted.
    'error': (error) => {
      console.log(error);
    }
  };
};

/**
 * @callback module:Worker~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_start} callback
 * @description Start the worker module.
 */
Worker.prototype.start = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Worker~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_close} callback
 * @description Close the worker module.
 */
Worker.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Worker~callback_of_import_my_worker_authenticity_data
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {noxerve_supported_data_type} worker_information
 * @param {module:Worker~callback_of_import_my_worker_authenticity_data} callback
 */
Worker.prototype.importMyWorkerAuthenticityData = function(worker_id, worker_authenticity_information, callback) {
  this._event_listeners['my-worker-authenticity-data-import'](worker_id, worker_authenticity_information, callback);
}

/**
 * @callback module:Worker~callback_of_import_static_global_random_seed
 * @param {error} error
 * @param {object} global_deterministic_random_manager
 */
/**
 * @memberof module:Worker
 * @param {buffer} static_global_random_seed_4096bytes
 * @param {module:Worker~callback_of_import_static_global_random_seed} callback
 */
Worker.prototype.importStaticGlobalRandomSeed = function(static_global_random_seed_4096bytes, callback) {
  this._event_listeners['static-global-random-seed-import'](static_global_random_seed_4096bytes, callback);
}

/**
 * @callback module:Worker~callback_of_import_worker_id_to_interfaces_mapping
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {object} worker_peers_settings
 * @param {module:Worker~callback_of_import_worker_id_to_interfaces_mapping} callback
 * @description Import all worker ids and its corresponeding interfaces.
 */
Worker.prototype.importWorkerPeersSettings = function(worker_peers_settings, callback) {
  this._event_listeners['worker-peers-settings-import'](worker_peers_settings, callback);
}

/**
 * @callback module:Worker~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
Worker.prototype.createWorkerSocket = function(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, callback) {
  this._event_listeners['worker-socket-create'](worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_on_worker_socket_create
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {object} worker_socket
 */
/**
 * @memberof module:Worker
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {module:Worker~callback_of_on_worker_socket_create} listener
 * @description Handle worker socket emitted from remote worker.
 */
Worker.prototype.onWorkerSocketCreate = function(worker_socket_purpose_name, listener) {
  this._event_listeners['worker-socket-create-' + worker_socket_purpose_name] = listener;
  this._event_listeners['hash-string-request'](worker_socket_purpose_name);
}

/**
 * @callback module:Worker~callback_of_join_me
 * @param {error} error
 * @param {integer} worker_id
 * @param {object} worker_peers_settings
 */
/**
 * @memberof module:Worker
 * @param {array} my_worker_interfaces - This worker avaliable interfaces.
 * @param {noxerve_supported_data_type} my_worker_detail - Detail of this worker.
 * @param {noxerve_supported_data_type} my_worker_authentication_data - Authenticication data of this worker.
 * @param {module:Worker~callback_of_join_me} callback
 * @description Join myself into workers cluster.
 */
Worker.prototype.joinMe = function(remote_worker_interfaces_connect_setting, my_worker_interfaces_connect_settings, my_worker_detail, my_worker_authentication_data, callback) {
  this._event_listeners['me-join'](remote_worker_interfaces_connect_setting, my_worker_interfaces_connect_settings, my_worker_detail, my_worker_authentication_data, callback);
}

/**
 * @callback module:Worker~callback_of_update_me
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} my_worker_interfaces - This worker avaliable interfaces.
 * @param {noxerve_supported_data_type} my_worker_detail - Detail of this worker.
 * @param {module:Worker~callback_of_update_me} callback
 * @description Update this worker with new informations.
 */
Worker.prototype.updateMe = function(my_worker_interfaces_connect_settings, my_worker_detail, callback) {
  this._event_listeners['me-update'](my_worker_interfaces_connect_settings, my_worker_detail, callback);
}

/**
 * @callback module:Worker~callback_of_leave_me
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_leave_me} callback
 * @description Leave this worker away from workers cluster.
 */
Worker.prototype.leaveMe = function(callback) {
  this._event_listeners['me-leave'](callback);
}

/**
 * @callback module:Worker~callback_of_leave_worker_peer
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {module:Worker~callback_of_leave_worker_peer} callback
 * @description Leave this worker away from workers cluster by worker id. Which
 * implies that you can remove any worker from workers cluster.
 */
Worker.prototype.leaveWorkerPeer = function(worker_id, callback) {
  this._event_listeners['worker-peer-leave'](worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_worker_peer_detail_get
 * @param {error} error
 * @param {noxerve_supported_data_type} detail
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {module:Worker~callback_of_worker_peer_detail_get} callback
 */
Worker.prototype.getWorkerPeerDetail = function(worker_id, callback) {
  this._event_listeners['worker-peer-detail-get'](worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:Worker
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description Worker events.
 */
Worker.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @memberof module:Worker
 * @param {string} event_name
 * @description Worker events emitter. For internal uses.
 */
Worker.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = Worker;

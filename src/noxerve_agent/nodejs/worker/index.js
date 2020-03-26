/**
 * @file NoXerveAgent worker index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Worker
 */

const Errors = require('../errors');
const WorkerSocket = require('./non_uniform/worker_socket');

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
    'worker-authenticication': (worker_authenticity_information) => {
      console.log(worker_authenticity_information);
      return true;
    },
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

}

/**
 * @callback module:Worker~callback_of_
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {noxerve_supported_data_type} worker_information
 * @param {module:Worker~callback_of_} callback
 */
Worker.prototype.importWorkerAuthenticityData = function(worker_id, worker_authenticity_information, callback) {
  this._event_listeners['worker-authenticity-data-import'](worker_id, worker_authenticity_information, callback);
}

/**
 * @callback module:Worker~callback_of_import_worker_id_to_interfaces_mapping
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {object} workers_settings
 * @param {module:Worker~callback_of_import_worker_id_to_interfaces_mapping} callback
 * @description Import all worker ids and its corresponeding interfaces.
 */
Worker.prototype.importWorkersSettings = function(workers_settings, callback) {
  this._event_listeners['workers-settings-import'](workers_settings, callback);
}

/**
 * @callback module:Worker~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameters - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
Worker.prototype.createWorkerSocket = function(worker_socket_purpose_name, worker_socket_purpose_parameters, remote_worker_id, callback) {
  this._event_listeners['worker-socket-create'](worker_socket_purpose_name, worker_socket_purpose_parameters, remote_worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_on_worker_socket_create
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameters - The purpose for this worker socket. Along with it's parameter.
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
}

/**
 * @callback module:Worker~callback_of_join_me
 * @param {integer} worker_id
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} my_worker_interfaces - This worker avaliable interfaces.
 * @param {noxerve_supported_data_type} my_worker_detail - Detail of this worker.
 * @param {noxerve_supported_data_type} my_worker_authenticication_data - Authenticication data of this worker.
 * @param {module:Worker~callback_of_join_me} callback
 * @description Join myself into workers cluster.
 */
Worker.prototype.joinMe = function(my_worker_interfaces, my_worker_detail, my_worker_authenticication_data, callback) {
  this._event_listeners['me-join'](my_worker_interfaces, my_worker_detail, my_worker_authenticication_data, callback);
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
Worker.prototype.updateMe = function(my_worker_interfaces, my_worker_detail, callback) {
  this._event_listeners['me-update'](my_worker_interfaces, my_worker_detail, callback);
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
 * @callback module:Worker~callback_of_leave_by_worker_id
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {module:Worker~callback_of_leave_by_worker_id} callback
 * @description Leave this worker away from workers cluster by worker id. Which
 * implies that you can remove any worker from workers cluster.
 */
Worker.prototype.leaveByWorkerId = function(worker_id, callback) {
  this._event_listeners['by-worker-id-leave'](worker_id, callback);
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

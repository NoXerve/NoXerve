/**
 * @file NoXerveAgent worker file. [worker.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Worker
 */

const Errors = require('../errors');
const NonUniform = require('./non_uniform');

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
   * @type {bool}
   * @private
   */
  this._is_non_uniform_list_fulfilled = false;

  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._event_listeners = {
    // Internal private default events.
    'non_uniform-of-worker-request': (callback) => {
      try {
        const non_uniform = new NonUniform();
        callback(false, non_uniform);
      } catch (error) {
        console.log(error);
        callback(error);
      }
    },
    'ready': (non_uniform_name_to_non_uniform_object_dict) => {

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
 * @callback module:Worker~callback_of_import_non_uniform_list
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} non_uniform_name_list
 * @param {module:Worker~callback_of_import_non_uniform_list} callback
 * @description Import all non_uniform names that the service needed.
 */
Worker.prototype.importNonUniformList = function(non_uniform_name_list, callback) {
  this._event_listeners['non_uniform-list-import'](non_uniform_name_list, callback);
}

/**
 * @callback module:Worker~callback_of_handle_non_uniform
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} non_uniform_name
 * @param {array} worker_id_to_interfaces_dict
 * @param {module:Worker~callback_of_handle_non_uniform} callback
 * @description Handle the non_uniform this service worker have. And connect to
 * other workers(peers) that handle the same non_uniform.
 */
Worker.prototype.handleNonUniform = function(non_uniform_name, worker_id_to_interfaces_dict, least_connection_percent, callback) {
  this._event_listeners['non_uniform-handle'](non_uniform_name, worker_id_to_interfaces_dict, least_connection_percent, callback);
}

/**
 * @callback module:Worker~callback_of_request_non_uniform
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} non_uniform_name
 * @param {array} worker_id_to_interfaces_dict
 * @param {module:Worker~callback_of_handle_non_uniform} callback
 * @description Handle the non_uniform this service worker have. And connect to
 * other worker that handle the same non_uniform.
 */
Worker.prototype.requestNonUniform = function(non_uniform_name, worker_id_to_interfaces_dict, callback) {
  this._event_listeners['non_uniform-request'](non_uniform_name, worker_id_to_interfaces_dict, callback);
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
 * @description Worker events. "ready" triggered if worker fullfill adequate
 * non_uniforms condition. Which needs to be completed by adding connections.
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

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
  this._is_resource_list_fulfilled = false;

  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'ready': (resource_name_to_resource_object_dict) => {

    },
    'worker-authenticication': (worker_authenticity_information) => {
      return worker_id;
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
 * @callback module:Worker~callback_of_import_resource_list
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} resource_name_list
 * @param {module:Worker~callback_of_import_resource_list} callback
 * @description Import all resource names that the service needed.
 */
Worker.prototype.importResourceList = function(resource_name_list, callback) {
  this._event_listeners['resource-list-import'](resource_name_list, callback);
}

/**
 * @callback module:Worker~callback_of_handle_resource
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} resource_name
 * @param {array} worker_id_to_interfaces_dict
 * @param {module:Worker~callback_of_handle_resource} callback
 * @description Handle the resource this service worker have. And connect to
 * other workers(peers) that handle the same resource.
 */
Worker.prototype.handleResource = function(resource_name, worker_id_to_interfaces_dict, least_connection_percent, callback) {
  this._event_listeners['resource-handle'](resource_name, worker_id_to_interfaces_dict, least_connection_percent, callback);
}

/**
 * @callback module:Worker~callback_of_request_resource
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} resource_name
 * @param {array} worker_id_to_interfaces_dict
 * @param {module:Worker~callback_of_handle_resource} callback
 * @description Handle the resource this service worker have. And connect to
 * other worker that handle the same resource.
 */
Worker.prototype.requestResource = function(resource_name, worker_id_to_interfaces_dict, callback) {
  this._event_listeners['resource-request'](resource_name, worker_id_to_interfaces_dict, callback);
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
 * resources condition. Which needs to be completed by adding connections.
 */
Worker.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

module.exports = Worker;

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

let Errors = require('../errors');

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
   this._event_listeners = {};
};

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
  this._event_listeners['resources-list-import'](resource_name_list, callback);
}

/**
 * @callback module:Worker~callback_of_import_resource_claim_list
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} resource_claim_list
 * @param {module:Worker~callback_of_import_resource_claim_list} callback
 * @description Import all resource names of resources that this service worker have.
 */
Worker.prototype.importResourceCliamList = function(resource_claim_list, callback) {
  this._event_listeners['resource-cliam-list-import'](resource_claim_list, callback);
}

/**
 * @callback module:Worker~callback_of_claim_resource
 * @param {object} resource_object
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} resource_name
 * @param {array} worker_id_to_interface_dict
 * @param {module:Worker~callback_of_claim_resource} callback
 * @description Claim the resource this service worker have. And connect to
 * other worker that handle the same resource.
 */
Worker.prototype.claimResource = function(resource_name, worker_id_to_interface_dict, callback) {
  this._event_listeners['resource-cliam'](resource_name, worker_id_to_interface_dict, callback);
}

/**
 * @callback module:Worker~callback_of_fulfill_resource_list
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {object} resource_name_to_intefaces_dict
 * @param {module:Worker~callback_of_connect} callback
 * @description Connect to NoXerveAgent Worker Network
 */
Worker.prototype.fulfillResourceList = function(resource_name_to_intefaces_dict, callback) {
  this._event_listeners['resources-list-fulfill'](resource_name_to_intefaces_dict, callback);
}

/**
 * @callback module:Worker~callback_of_on
 * @param {error} error
 * @param {}
 */
/**
 * @memberof module:Worker
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} callback
 * @description Worker events. "ready" triggered if worker fullfill adequate
 * resources condition. Which needs to be completed by adding connections.
 */
Worker.prototype.on = function(event_name, callback) {

}

module.exports = Worker;

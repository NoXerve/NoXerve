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
  // this._worker_variable = {
  //   _resources_list_imported: false,
  //   _resources_list: []
  // };
};

/**
 * @callback module:Worker~callback_of_import_resource_list
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} resource_list
 * @param {module:Worker~callback_of_import_resource_list} callback
 * @description Connect to NoXerveAgent Worker Network
 */
Worker.prototype.importResourceList = function(resource_list, callback) {

}

/**
 * @callback module:Worker~callback_of_connect
 * @param {}
 * @param {}
 */
/**
 * @memberof module:Worker
 * @param {object} remote_passive_interfaces
 * @param {module:Worker~callback_of_connect} callback
 * @description Connect to NoXerveAgent Worker Network
 */
Worker.prototype.addConnections = function(remote_passive_interfaces, callback) {
  if (this.Worker._resources_list_imported !== true) {
    // abort opearation if resource_list is not prepared
    callback(true);
  } else {

  }
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

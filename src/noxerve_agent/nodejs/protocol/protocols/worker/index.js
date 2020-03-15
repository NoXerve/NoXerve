/**
 * @file NoXerveAgent worker protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');

/**
 * @constructor module:WorkerProtocol
 * @param {object} settings
 * @description NoXerve Agent ServiceProtocol Object. Protocols of service module.
 */
function WorkerProtocol(settings) {
  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._worker_module = settings.related_module;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description Open a handshake.
   */
  this._open_handshake_function = settings.open_handshake;

  /**
   * @memberof module:WorkerProtocol
   * @type {integer}
   * @private
   * @description WorkerId. 0 as initial value.
   */
  this._worker_id = 0;

  /**
   * @memberof module:WorkerProtocol
   * @type {noxerve_supported_data_type}
   * @private
   * @description Worker authenticity data. Avoid being hacked. Provide in handshake communication.
   */
  this._worker_authenticity_data = null;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description WorkerId as key tunnel as value dictionary.
   */
  this._worker_id_to_tunnel_dict = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {array}
   * @private
   * @description Resource name list. Resource names that the service needed.
   * With name as key, ready, worker_id as value.
   */
  this._resource_dict = [];

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description Resource name list. Resource names of resources that this service worker have.
   * With name as key, ready, resource_peers as value.
   */
  this._resource_handle_dict = {};
}

/**
 * @callback module:WorkerProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:ServiceProtocol
 * @param {module:WorkerProtocol~callback_of_start} callback
 * @description Start running WorkerProtocol.
 */
WorkerProtocol.prototype.start = function(callback) {
  if(callback) callback(false);
  this._worker_module.on('worker-authenticity-data-import', (worker_id, worker_authenticity_information, callback) => {

  });

  this._worker_module.on('resource-list-import', (resource_name_list, callback) => {

  });

  this._worker_module.on('resource-handle', (resource_name, worker_id_to_interface_dict, callback) => {

  });

  this._worker_module.on('resource-request', (resource_name, worker_id_to_interface_dict, callback) => {

  });

  // this._worker_module.on('resources-list-fulfill', (resource_name_to_intefaces_dict, callback) => {
  //
  // });
}

/**
 * @callback module:WorkerProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerProtocol
 * @param {module:WorkerProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerProtocol.prototype.close = function(callback) {
  if(callback) callback(false);
}

/**
 * @memberof module:ServiceProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge) {
  // Synchronize information for handshake
  // Format:
  // worker byte
  // 0x02

  if (synchronize_information.length === 1 && synchronize_information[0] === 2) {
    onError((error) => {
      return false;
    });

    onAcknowledge((acknowledge_information, tunnel) => {
      if (acknowledge_information[0] === 0x01) {
      } else {
        return false;
      }
    });

    // Send 8 bytes id;
    return Buf.from([0x01]);
  } else return false;
}


module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: function() {}
};

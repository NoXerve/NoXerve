/**
 * @file NoXerveAgent service protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const ServiceOfActivityProtocol = require('./service_of_activity');


/**
 * @constructor module:ServiceProtocol
 * @param {object} settings
 * @description NoXerve Agent ServiceProtocol Object. Protocols of service module.
 */

function ServiceProtocol(settings) {
  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   */
  this._service_module = settings.related_module;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   * @description Open a handshake. Actually useless for ServiceProtocol module.
   */
  this._open_handshake_function = settings.open_handshake;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   * @description ServiceOfActivityProtocol submodule.
   */
  this._service_of_activity_protocol = new ServiceOfActivityProtocol({hash_manager: settings.hash_manager});
}

/**
 * @callback module:ServiceProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:ServiceProtocol
 * @param {module:ServiceProtocol~callback_of_start} callback
 * @description Start running ServiceProtocol.
 */
ServiceProtocol.prototype.start = function(callback) {
  if(callback) callback(false);
}

/**
 * @callback module:ServiceProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:ServiceProtocol
 * @param {module:ServiceProtocol~callback_of_close} callback
 * @description Close the module.
 */
ServiceProtocol.prototype.close = function(callback) {
  if(callback) callback(false);
}

/**
 * @memberof module:ServiceProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
ServiceProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge) {
  // Synchronize information for handshake
  // Format:
  // service-activity byte
  // 0x01

  if (synchronize_information.length === 1 && synchronize_information[0] === 1) {
    const generated_activity_id = Utils.random8Bytes();
    const generated_activity_id_base64 = generated_activity_id.toString('base64');

    onError((error) => {
      return false;
    });

    onAcknowledge((acknowledge_information, tunnel) => {
      if (acknowledge_information[0] === 0x01) {
        this._service_module.emitEventListener('service-of-activity-request', (error, service_of_activity) => {
          this._service_of_activity_protocol.handleTunnel(error, service_of_activity, tunnel);
          this._service_module.emitEventListener('service-of-activity-ready', service_of_activity)
        });
      } else {
        return false;
      }
    });

    // Send 8 bytes id;
    return generated_activity_id;
  } else return false;
}

module.exports = {
  protocol_name: 'service',
  related_module_name: 'service',
  module: ServiceProtocol
};

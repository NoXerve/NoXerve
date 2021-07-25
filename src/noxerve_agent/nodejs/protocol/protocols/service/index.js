/**
 * @file NoXerveAgent service protocol index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const ServiceOfServiceProtocol = require('./service_of_activity');


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
  this._synchronize_function = settings.synchronize;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.embedded_protocols['nsdt_embedded'];

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   * @description ServiceOfServiceProtocol submodule.
   */
  this._service_of_activity_protocol = new ServiceOfServiceProtocol({
    hash_manager: settings.hash_manager,
    nsdt_embedded_protocol: settings.embedded_protocols['nsdt_embedded']
  });
}

/**
 * @memberof module:ServiceProtocol
 * @type {object}
 * @private
 */
ServiceProtocol.prototype._ProtocolCodes = {
  // Root protocol code
  service_and_activity: Buf.from([0x01]),
  accept: Buf.from([0x01]),
  reject: Buf.from([0x00]),
  unknown_reason_reject_2_bytes: Buf.from([0x00, 0x01]),
  not_exist_reason_reject_2_bytes: Buf.from([0x00, 0x02]),
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
  this._service_module.on('hash-string-request', (activity_purpose_name) => {
    this._hash_manager.hashString4Bytes(activity_purpose_name);
  });
  if (callback) callback(false);
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
  if (callback) callback(false);
}

/**
 * @callback module:ServiceProtocol~synchronize_acknowledgment
 * @param {buffer} synchronize_returned_data
 * @param {function} synchronize_acknowledgment_error_handler
 * @param {function} acknowledge_handler
 */
/**
 * @memberof module:ServiceProtocol
 * @param {buffer} synchronize_message_bytes
 * @param {module:ServiceProtocol~synchronize_acknowledgment} synchronize_acknowledgment
 * @description Synchronize handshake from remote emitter.
 */
ServiceProtocol.prototype.SynchronizeListener = function(synchronize_message_bytes, synchronize_acknowledgment) {
  // Synchronize information for handshake
  // Format:
  // service-activity byte
  // 0x01
  if (synchronize_message_bytes[0] === this._ProtocolCodes.service_and_activity[0]) {
    // const generated_activity_id = Utils.random8Bytes();
    // const generated_activity_id_base64 = generated_activity_id.toString('base64');

    const activity_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_message_bytes.slice(1, 5));
    const activity_purpose_parameter = this._nsdt_embedded_protocol.decode(synchronize_message_bytes.slice(5));

    const synchronize_acknowledgment_error_handler = (error) => {
      console.log('Serivce protocol verbose.', error);
    };

    const acknowledge_handler = (acknowledge_message_bytes, tunnel) => {
      if (acknowledge_message_bytes[0] === this._ProtocolCodes.service_and_activity[0]) {
        this._service_module.emitEventListener('service-of-activity-request', (error, service_of_activity) => {
          this._service_of_activity_protocol.handleTunnel(error, service_of_activity, tunnel);
          try {
            this._service_module.emitEventListener('service-of-activity-ready', activity_purpose_name, activity_purpose_parameter, service_of_activity)
          }
          catch(error) {
            tunnel.close();
          }
        });
      } else {
        tunnel.close();
      }
    };

    if(this._service_module.emitEventListener('service-of-activity-purpose-exist', activity_purpose_name)) {
      // Send 8 bytes id;
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.service_and_activity,
        this._ProtocolCodes.accept,
        // generated_activity_id
      ]), synchronize_acknowledgment_error_handler, acknowledge_handler);
    }
    else {
      // Send 8 bytes id;
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.service_and_activity,
        this._ProtocolCodes.not_exist_reason_reject_2_bytes,
        // generated_activity_id
      ]), synchronize_acknowledgment_error_handler, acknowledge_handler);
    }


  } else synchronize_acknowledgment(false);
}

module.exports = {
  protocol_name: 'service',
  related_module_name: 'service',
  module: ServiceProtocol
};

/**
 * @file NoXerveAgent activity protocol index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module ActivityProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const ActivityOfServiceProtocol = require('./activity_of_service');


/**
 * @constructor module:ActivityProtocol
 * @param {object} settings
 * @description NoXerve Agent ActivityProtocol Object. Protocols of activity module.
 */

function ActivityProtocol(settings) {
  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   */
  this._activity_module = settings.related_module;

  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.embedded_protocols['nsdt_embedded'];

  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   * @description Open a handshake.
   */
  this._synchronize_function = settings.synchronize;

  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   * @description ActivityOfServiceProtocol submodule.
   */
  this._activity_of_service_protocol = new ActivityOfServiceProtocol({
    hash_manager: settings.hash_manager,
    nsdt_embedded_protocol: settings.embedded_protocols['nsdt_embedded']
  });
}

/**
 * @memberof module:ActivityProtocol
 * @type {object}
 * @private
 */
ActivityProtocol.prototype._ProtocolCodes = {
  // Root protocol code
  service_and_activity: Buf.from([0x01]),
  accept: Buf.from([0x01]),
  reject: Buf.from([0x00]),
  unknown_reason_reject_2_bytes: Buf.from([0x00, 0x01]),
  not_exist_reason_reject_2_bytes: Buf.from([0x00, 0x02]),
}

/**
 * @callback module:ActivityProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:ActivityProtocol
 * @param {module:ActivityProtocol~callback_of_start} callback
 * @description Start the module.
 */
ActivityProtocol.prototype.start = function(callback) {

  // Create activity from activity module.
  this._activity_module.on('activity-create', (connector_settings_list, activity_purpose_name, activity_purpose_parameter, create_activity_callback) => {

    // Shuffle for clientwise loadbalancing.
    const shuffled_connector_settings_list = Utils.shuffleArray(connector_settings_list);

    // Synchronize information for handshake
    const activity_purpose_name_4bytes = this._hash_manager.hashString4Bytes(activity_purpose_name);
    const activity_purpose_parameter_bytes = this._nsdt_embedded_protocol.encode(activity_purpose_parameter);
    const synchronize_message_bytes = Buf.concat([
      this._ProtocolCodes.service_and_activity,
      activity_purpose_name_4bytes,
      activity_purpose_parameter_bytes
    ]);

    // Proceed tunnel creations loop.
    let index = 0;
    // Loop loop() with condition.
    const loop_next = () => {
      index++;
      if (index < shuffled_connector_settings_list.length) {
        loop();
      }
      // No more next loop. Exit.
      else {
        create_activity_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY('Create activity error. Could not connect to any interfaces.'));
      }
    };
    const loop = () => {
      const interface_name = shuffled_connector_settings_list[index].interface_name;
      const connector_settings = shuffled_connector_settings_list[index].connector_settings;

      const synchronize_error_handler = (synchronize_error) => {
        loop_next();
      };

      const synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
        // Handshake opened. Check if synchronize_acknowledgment_message_bytes valid.
        try {
          if(synchronize_acknowledgment_message_bytes[0] === this._ProtocolCodes.service_and_activity[0] && synchronize_acknowledgment_message_bytes[1] === this._ProtocolCodes.accept[0]) {

            // Acknowledgement information for handshake
            const acknowledge_message_bytes = this._ProtocolCodes.service_and_activity;

            // Return acknowledge binary.
            acknowledge(acknowledge_message_bytes, (error, tunnel) => {
              this._activity_module.emitEventListener('activity-of-service-request', (error, activity_of_service) => {
                this._activity_of_service_protocol.handleTunnel(error, activity_of_service, tunnel);
                create_activity_callback(error, activity_of_service);
              });
            });
          }
          else if(synchronize_acknowledgment_message_bytes[0] === this._ProtocolCodes.service_and_activity[0] && synchronize_acknowledgment_message_bytes[1] === this._ProtocolCodes.reject[0]) {
            if(synchronize_acknowledgment_message_bytes[2] === this._ProtocolCodes.not_exist_reason_reject_2_bytes[1]) {
              create_activity_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY('Create activity error. Service for such purpose does not exist.'));
              acknowledge(false);
            }
            else {
              create_activity_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY('Create activity error. Rejected for unknown reason.'));
              acknowledge(false);
            }
          }
          else {
            loop_next();

            // Return acknowledge_message_bytes(not acknowledge).
            acknowledge(false);
          }
        } catch (error) {
          // Unable to open handshake. Next loop.
          loop_next();

          // Return acknowledge_message_bytes(not acknowledge).
          acknowledge(false);
        }
      };

      // Callbacks setup completed. Start handshake process.
      this._synchronize_function(interface_name, connector_settings, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler);
    };
    loop();
  });
  if (callback) callback(false);
}

/**
 * @callback module:ActivityProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:ActivityProtocol
 * @param {module:ActivityProtocol~callback_of_close} callback
 * @description Close the module.
 */
ActivityProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:ActivityProtocol~callback_of_synchronize_acknowledgment
 * @param {buffer} synchronize_returned_data
 */
/**
 * @memberof module:ActivityProtocol
 * @param {buffer} synchronize_message_bytes
 * @param {function} handle_synchronize_acknowledgment_error
 * @param {function} handle_acknowledge
 * @param {module:ActivityProtocol~callback_of_synchronize_acknowledgment} synchronize_acknowledgment
 * @description Synchronize handshake from remote emitter.
 */
ActivityProtocol.prototype.SynchronizeListener = function(synchronize_message_bytes, synchronize_acknowledgment, handle_synchronize_acknowledgment_error, handle_acknowledge) {
  // Activity doesn't support SYN.
  synchronize_acknowledgment(false);
}


module.exports = {
  protocol_name: 'activity',
  related_module_name: 'activity',
  module: ActivityProtocol
};

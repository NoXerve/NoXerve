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
   * @description Open a handshake.
   */
  this._open_handshake_function = settings.open_handshake;

  /**
   * @memberof module:ActivityProtocol
   * @type {object}
   * @private
   * @description ActivityOfServiceProtocol submodule.
   */
  this._activity_of_service_protocol = new ActivityOfServiceProtocol({
    hash_manager: settings.hash_manager
  });
}

/**
 * @memberof module:ActivityProtocol
 * @type {object}
 * @private
 */
ActivityProtocol.prototype._ProtocolCodes = {
  service_and_activity: Buf.from([0x01])
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
  this._activity_module.on('activity-create', (interface_connect_settings_list, create_activity_callback) => {

    // Shuffle for clientwise loadbalancing.
    const shuffled_interface_connect_settings_list = Utils.shuffleArray(interface_connect_settings_list);

    // Get activity_id from synchronize_acknowledgement_information;
    let activity_id;

    // Synchronize information for handshake
    // Format:
    // service-activity byte
    // 0x01
    const synchronize_information = this._ProtocolCodes.service_and_activity;

    // Proceed tunnel creations loop.
    let index = 0;
    // Loop loop() with condition.
    const loop_next = () => {
      index++;
      if (index < shuffled_interface_connect_settings_list.length) {
        loop();
      }
      // No more next loop. Exit.
      else {
        // [Flag] Uncatogorized error.
        create_activity_callback(true);
      }
    };
    const loop = () => {
      const interface_name = shuffled_interface_connect_settings_list[index].interface_name;
      const interface_connect_settings = shuffled_interface_connect_settings_list[index].interface_connect_settings;

      const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
        if (open_handshanke_error) {
          // Unable to open handshake. Next loop.
          loop_next();

          // Return acknowledge_information(not acknowledge).
          next(false);
        } else {
          // Handshake opened. Check if synchronize_acknowledgement_information valid.
          try {
            if(synchronize_acknowledgement_information[0] === this._ProtocolCodes.service_and_activity[0]) {
              activity_id = synchronize_acknowledgement_information;
              // Acknowledgement information for handshake
              // Format:
              // acknowledge byte
              // 0x01(ok)
              // 0x00(not ok)
              const acknowledge_information = this._ProtocolCodes.service_and_activity;

              // Return acknowledge binary.
              next(acknowledge_information);
            }
            else {
              loop_next();

              // Return acknowledge_information(not acknowledge).
              next(false);
            }
          } catch (error) {
            // Unable to open handshake. Next loop.
            loop_next();

            // Return acknowledge_information(not acknowledge).
            next(false);
          }
        }
      };

      const finish_handshake = (error, tunnel) => {
        if (error) {
          // Unable to open handshake. Next loop.
          loop_next();
        } else {
          this._activity_module.emitEventListener('activity-of-service-request', (error, activity_of_service) => {
            this._activity_of_service_protocol.handleTunnel(error, activity_of_service, tunnel);
            create_activity_callback(error, activity_of_service);
          });
        }
      };

      // Callbacks setup completed. Start handshake process.
      this._open_handshake_function(interface_name, interface_connect_settings, synchronize_information, acknowledge_synchronization, finish_handshake);
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
 * @memberof module:ActivityProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
ActivityProtocol.prototype.synchronize = function(synchronize_information, next) {
  // Activity doesn't support SYN.
  next(false);
}


module.exports = {
  protocol_name: 'activity',
  related_module_name: 'activity',
  module: ActivityProtocol
};

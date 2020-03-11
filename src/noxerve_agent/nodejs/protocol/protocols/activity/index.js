/**
 * @file NoXerveAgent activity protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ActivityProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');

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
}

// [Flag] Unfinished annotation.
// Reference: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
ActivityProtocol.prototype._shuffleList = function(array) {
  let current_index = array.length,
    temporary_value, random_index;

  // While there remain elements to shuffle...
  while (0 !== current_index) {

    // Pick a remaining element...
    random_index = Math.floor(Math.random() * current_index);
    current_index -= 1;

    // And swap it with the current element.
    temporary_value = array[current_index];
    array[current_index] = array[random_index];
    array[random_index] = temporary_value;
  }

  return array;
}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.start = function() {

  // Create activity from activity module.
  this._activity_module.on('create-activity', (interface_connect_settings_list, callback) => {

    // Shuffle for clientwise loadbalancing.
    let shuffled_interface_connect_settings_list = this._shuffleList(interface_connect_settings_list);

    // Get activity_id from synchronize_acknowledgement_information;
    let activity_id;

    // Synchronize information for handshake
    // Format:
    // service-activity byte
    // 0x01
    let synchronize_information = Buf.from([1]);;

    // Proceed tunnel creations loop.
    let index = 0;
    let loop = ()=> {
      const interface_name = shuffled_interface_connect_settings_list[index].interface_name;
      const interface_connect_settings = shuffled_interface_connect_settings_list[interface_name].interface_connect_settings;

      // Loop loop() with condition.
      const next_loop = ()=> {
        if(index < shuffled_interface_connect_settings_list.length) {
          index++;
          loop();
        }
        // No more next loop. Exit.
        else {
          // [Flag] Uncatogorized error.
          callback(true);
        }
      };

      const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information)=> {
        if(open_handshanke_error) {
          // Unable to open handshake. Next loop.
          next_loop();

          // Return acknowledge_information(not acknowledge).
          return false;
        }
        else {
          // Handshake opened. Check if synchronize_acknowledgement_information valid.
          try {
            let acknowledge_information;
            //
            return acknowledge_information;
          }
          catch(error) {
            // Unable to open handshake. Next loop.
            next_loop();

            // Return acknowledge_information(not acknowledge).
            return false;
          }
        }
      };

      const finish_handshake = (error, tunnel)=> {
        if(error) {
          // Unable to open handshake. Next loop.
          next_loop();
        }
        else {
          callback(error, tunnel);
        }
      }

      _open_handshake_function(interface_name, interface_connect_settings, synchronize_information, acknowledge_synchronization, finish_handshake);
    };
    loop();
  });
}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.close = function() {

}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.synchronize = function(synchronize_information) {
  // Activity doesn't support SYN.
  return false;
}

// [Flag] Unfinished annotation.
// The "synchronize_information" parameter is identical to the one from synchronize.
ActivityProtocol.prototype.onSynchronizationError = function(err, synchronize_information) {
  // Activity doesn't support SYN.
  return false;
}

// [Flag] Unfinished annotation.
ActivityProtocol.prototype.acknowledge = function(acknowledge_information, tunnel) {
  // Activity doesn't support ACK.
  return false;
}


module.exports = {
  protocol_name: 'activity',
  related_module_name: 'activity',
  module: ActivityProtocol
};

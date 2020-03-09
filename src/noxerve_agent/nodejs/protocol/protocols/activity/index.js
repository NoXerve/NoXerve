/**
 * @file NoXerveAgent activity protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Protocol
 */

const Errors = require('../errors');
const Buf = require('../../../buffer');

/**
 * @constructor module:ActivityProtocol
 * @param {object} settings
 * @description NoXerve ActivityProtocol Object. Protocols of activity module.
 */

function ActivityProtocol(settings) {
  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._activity_module = settings.related_module;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   * @description
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
  this._activity_module.on('create-activity', (interface_connect_settings_list) => {
    let shuffled_interface_connect_settings_list = this._shuffleList(interface_connect_settings_list);
    for(const index in shuffled_interface_connect_settings_list) {
      const interface_connect_settings = shuffled_interface_connect_settings_list[index];

      const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, tunnel)=> {

      };

      _open_handshake_function(interface_connect_settings, acknowledge_synchronization);
    }
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


module.exports = ActivityProtocol;

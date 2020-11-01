/**
 * @file NoXerveAgent Locker file. [locker.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Locker
 */

const Errors = require('../../../../../../errors');
const Buf = require('../../../../../../buffer');
const OPERATIONS_PER_DETERMINISTIC_CYCLE = 64;

/**
 * @constructor module:Locker
 * @param {object} settings
 * @description Locker Object.
 */

function Locker(settings) {
  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._channel = settings.channel;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._global_deterministic_random_manager = settings.global_deterministic_random_manager;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._random_seed_8_bytes = settings.random_seed_8_bytes;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol_encode = null;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol_decode = null;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol_destroy = null;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._locked = false;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._lock_value_nsdt = null;

  /**
   * @memberof module:Locker
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    locked: () => {

    },
    unlocked: () => {

    }
  };
}

Locker.prototype._ProtocolCodes = {
  nsdt_embedded:([0x10])
}

// [Flag]
Locker.prototype.lock = function(lock_value_nsdt, callback) {
  // console.log('lock');
  // if() {
  //
  // }
}

// [Flag]
Locker.prototype.unlock = function(callback) {
}

// [Flag]
Locker.prototype.toggle = function(lock_value_nsdt, callback) {
}

// [Flag]
Locker.prototype.destroy = function(callback) {
  this._nsdt_embedded_protocol_destroy();
  callback(false);
}

// [Flag]
Locker.prototype.start = function(callback) {
  this._channel.start((error) => {
    if(error) callback(error);
    else {
      this._nsdt_embedded_protocol.createRuntimeProtocol((error, nsdt_embedded_protocol_encode, nsdt_embedded_protocol_decode, nsdt_on_data, nsdt_emit_data, nsdt_embedded_protocol_destroy) => {
        if(error) { callback(error); return;}
        else {
          // nsdt embedded runtime protocol setup.
          nsdt_on_data((data_bytes) => {
            this._channel.broadcast(Buf.concat([
              this._ProtocolCodes.nsdt_embedded,
              data_bytes
            ]));
          });

          this._channel.on('data', (group_peer_id, data_bytes) => {
            const protocol_code_int = data_bytes[0];
            if(protocol_code_int === this._ProtocolCodes.nsdt_embedded[0]) {
              nsdt_emit_data(data_bytes.slice(1));
            }
            // else if() {
            //
            // }
          });

          this._channel.on('request-response', (group_peer_id, data_bytes, response) => {
            response(null);
          });

          this._channel.on('handshake', (group_peer_id, synchronize_message_bytes, synchronize_acknowledgment) => {
            synchronize_acknowledgment(null, (synchronize_acknowledgment_error, acknowledge_message_bytes) => {
            });
          });

          callback(false);
        }
      });
    }
  });
}

/**
 * @callback module:Locker~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:Locker
 * @param {string} event_name
 * @param {module:Locker~callback_of_on} callback
 * @description Register event listener.
 */
Locker.prototype.on = function(event_name, callback) {
  this._event_listener_dict[event_name] = callback;
}

/**
 * @memberof module:Locker
 * @param {string} event_name
 * @description Locker events emitter. For internal uses.
 */
Locker.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = {
  register_code: 1,
  module: Locker
};

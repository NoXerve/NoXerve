/**
 * @file NoXerveAgent worker group variable file. [vaiable.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Variable
 */

const Errors = require('../../../../../../errors');
const Buf = require('../../../../../../buffer');
const OPERATION_ITERATIONS_PER_DETERMINISTIC_CYCLE = 64;

/**
 * @constructor module:Variable
 * @param {object} settings
 * @description Variable Object.
 */

function Variable(settings) {
  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Variable
   * @type {integer}
   * @private
   */
  this._operation_iterations = 0;

  /**
   * @memberof module:Variable
   * @type {integer}
   * @private
   */
  this._on_duty_group_peer_id = 0;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._group_peers_count = settings.group_peers_count;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._channel = settings.channel;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._global_deterministic_random_manager = settings.global_deterministic_random_manager;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._random_seed_8_bytes = settings.random_seed_8_bytes;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol_encode = null;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol_decode = null;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol_destroy = null;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._variable_value_nsdt = null;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    update: () => {

    }
  };
}

Variable.prototype._ProtocolCodes = {
  update_request_response: Buf.from([0x00]),
  update_handshake: Buf.from([0x01]),
  nsdt_embedded: Buf.from([0x10])
}

// [Flag]
Variable.prototype.update = function(variable_value_nsdt, callback) {
  this._channel.request(this._on_duty_group_peer_id, Buf.concat([

  ]), (error, response_data_bytes) => {
    if(error) {
      callback(error);
    }
    else {

    }
  });
}

// [Flag]
Variable.prototype.getValue = function(callback) {
  callback(false, this._variable_value_nsdt);
}


// [Flag]
// Variable.prototype.destroy = function(callback) {
//   this._nsdt_embedded_protocol_destroy();
//   callback(false);
// }

// [Flag]
Variable.prototype.start = function(callback) {
  this._global_deterministic_random_manager.generateIntegerListInRange(this._random_seed_8_bytes, 1, this._group_peers_count, 1, (error, int_list) => {
    if(error) { callback(error); return;}
    else {
      this._on_duty_group_peer_id = int_list[0];
      console.log(this._on_duty_group_peer_id);
      this._nsdt_embedded_protocol.createRuntimeProtocol((error, nsdt_embedded_protocol_encode, nsdt_embedded_protocol_decode, nsdt_on_data, nsdt_emit_data, nsdt_embedded_protocol_destroy) => {
        if(error) { callback(error); return;}
        else {
          this._channel.start((error) => {
            if(error) callback(error);
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
                const protocol_code_int = data_bytes[0];
                if(protocol_code_int === this._ProtocolCodes.update_request_response[0]) {
                  response(null);
                }

              });

              this._channel.on('handshake', (group_peer_id, synchronize_message_bytes, synchronize_acknowledgment) => {
                const protocol_code_int = data_bytes[0];
                if(protocol_code_int === this._ProtocolCodes.update_handshake[0]) {
                  synchronize_acknowledgment(null, (synchronize_acknowledgment_error, acknowledge_message_bytes) => {
                  });
                }

              });

              callback(false);
            }
          });
        }
      });
    }
  });
}

/**
 * @callback module:Variable~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:Variable
 * @param {string} event_name
 * @param {module:Variable~callback_of_on} callback
 * @description Register event listener.
 */
Variable.prototype.on = function(event_name, callback) {
  this._event_listener_dict[event_name] = callback;
}

/**
 * @memberof module:Variable
 * @param {string} event_name
 * @description Variable events emitter. For internal uses.
 */
Variable.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = {
  register_code: 1,
  module: Variable
};
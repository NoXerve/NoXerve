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
   * @type {function}
   * @private
   */
  this._my_group_peer_id = settings.my_group_peer_id;

  /**
   * @memberof module:Variable
   * @type {integer}
   * @private
   */
  this._operation_iterations_count = 0;

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
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

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
   * @type {integer}
   * @description 0 ready 1 updating 2 myself-updating
   * @private
   */
  this._state_int = 0;

  /**
   * @memberof module:Variable
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    update: (group_peer_id, variable_value_nsdt) => {

    }
  };
}

Variable.prototype._ProtocolCodes = {
  update_request_response: Buf.from([0x00]),
  update_handshake: Buf.from([0x01]),
  operation_iterations_count_check_request_response: Buf.from([0x02]),
  nsdt_embedded: Buf.from([0x10]),

  updating_error: Buf.from([0x01])
}

// [Flag]
Variable.prototype.updateValue = function(variable_value_nsdt, callback) {
  if(this._state_int === 0) {
    this._state_int = 2;
    this._channel.request(this._on_duty_group_peer_id, Buf.concat([
      this._ProtocolCodes.update_request_response,
      this._nsdt_embedded_protocol_encode(variable_value_nsdt)
    ]), (error, response_data_bytes) => {
      if(error) {
        callback(error);
      }
      else if (response_data_bytes[0] ===  this._worker_global_protocol_codes.accept[0]) {
        this._on_duty_group_peer_id = this._my_group_peer_id;
        this._variable_value_nsdt = variable_value_nsdt;
        this._operation_iterations_count += 1;
        this._state_int = 0;
        callback(false);
      }
      else {
        this._state_int = 0;
        callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Request variable update failed.'));
      }
    });
  }
  else {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Variable id updating.'));
  }
}

// [Flag]
Variable.prototype.getValue = function(callback) {
  if(this._state_int === 0) {
    this._channel.request(this._on_duty_group_peer_id, Buf.concat([
      this._ProtocolCodes.operation_iterations_count_check_request_response,
      Buf.encodeUInt32BE(this._operation_iterations_count)
    ]), (error, response_data_bytes) => {
      if(error) {
        callback(error);
      }
      else if (response_data_bytes[0] === this._worker_global_protocol_codes.accept[0]) {
        if(response_data_bytes.length !== 1) {
          // Restore data.
          this._operation_iterations_count = Buf.decodeUInt32BE(response_data_bytes.slice(1, 5));
          this._variable_value_nsdt = this._nsdt_embedded_protocol_decode(this._on_duty_group_peer_id, response_data_bytes.slice(5));
        }
        callback(false, this._variable_value_nsdt);
      }
      else {
        if(response_data_bytes[1]) {
          if(response_data_bytes[1] === this._ProtocolCodes.updating_error[0]) {
            callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Remote is updating variable.'));
          }
          else {
            callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Unknown error.'));
          }
        }
        else {
          callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Unknown error.'));

        }
        // callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Iterations count check from on duty group peer failed.'));
      }
    });
  }
  else {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Variable is updating.'));
  }
}


// [Flag]
// Variable.prototype.destroy = function(callback) {
//   this._nsdt_embedded_protocol_destroy();
//   callback(false);
// }

// [Flag]
Variable.prototype.start = function(callback) {
  this._global_deterministic_random_manager.generateIntegerInRange(this._random_seed_8_bytes, 1, this._group_peers_count, (error, integer) => {
    if(error) { callback(error); return;}
    else {
      this._on_duty_group_peer_id = integer;
      this._nsdt_embedded_protocol.createMultidirectionalProtocol(this._group_peers_count, this._my_group_peer_id, (error, nsdt_embedded_protocol_encode, nsdt_embedded_protocol_decode, nsdt_on_data, nsdt_emit_data, nsdt_embedded_protocol_destroy) => {
        if(error) { callback(error); return;}
        else {
          this._nsdt_embedded_protocol_encode = nsdt_embedded_protocol_encode;
          this._nsdt_embedded_protocol_decode = nsdt_embedded_protocol_decode;

          this._channel.start((error) => {
            if(error) callback(error);
            else {
              // nsdt embedded runtime protocol setup.
              nsdt_on_data((group_peer_id, data_bytes) => {
                this._channel.unicast(group_peer_id, Buf.concat([
                  this._ProtocolCodes.nsdt_embedded,
                  data_bytes
                ]));
              });

              this._channel.on('data', (group_peer_id, data_bytes) => {
                const protocol_code_int = data_bytes[0];
                if(protocol_code_int === this._ProtocolCodes.nsdt_embedded[0]) {
                  nsdt_emit_data(group_peer_id, data_bytes.slice(1));
                }
                // else if() {
                //
                // }
              });

              this._channel.on('request-response', (group_peer_id, data_bytes, response) => {
                const protocol_code_int = data_bytes[0];
                if(protocol_code_int === this._ProtocolCodes.update_request_response[0]) {
                  const target_group_peer_id_4bytes = Buf.encodeUInt32BE(group_peer_id);
                  // const variable_value_nsdt = this._nsdt_embedded_protocol_decode(data_bytes.slice(1));
                  if((this._on_duty_group_peer_id === this._my_group_peer_id && (this._state_int === 0 || this._state_int === 2))) {

                    const a_synchronize_acknowledgment_handler = (group_peer_id, synchronize_error, synchronize_acknowledgment_message_bytes, register_synchronize_acknowledgment_status) => {
                      if(synchronize_error) {
                        register_synchronize_acknowledgment_status({
                          accept: false
                        });
                      }
                      else if (synchronize_acknowledgment_message_bytes[0] === this._worker_global_protocol_codes.accept[0]){
                        register_synchronize_acknowledgment_status({
                          accept: true
                        });
                      }
                      else {
                        register_synchronize_acknowledgment_status({
                          accept: false
                        });
                      }
                    };

                    const synchronize_acknowledgment_finished_listener = (error, finished_synchronize_group_peer_acknowledge_dict, synchronize_acknowledgment_status_dict) => {
                      const cancel_synchronize = () => {
                        response(this._worker_global_protocol_codes.reject);
                        for(let key in finished_synchronize_group_peer_acknowledge_dict) {
                          finished_synchronize_group_peer_acknowledge_dict[key](this._worker_global_protocol_codes.reject);
                        }
                      };
                      if(error) {
                        cancel_synchronize();
                      }
                      else {
                        // Check all accept.
                        let all_accept = true;
                        for(let key in synchronize_acknowledgment_status_dict) {
                          if(synchronize_acknowledgment_status_dict[key].accept === false) {
                            all_accept = false;
                            break;
                          }
                        }
                        if(all_accept) {
                          response(this._worker_global_protocol_codes.accept);
                          for(let key in finished_synchronize_group_peer_acknowledge_dict) {
                            finished_synchronize_group_peer_acknowledge_dict[key](this._worker_global_protocol_codes.accept);
                          }
                        }
                        else {
                          cancel_synchronize();
                        }
                      }
                    };

                    const acknowledge_finished_listener = (error, finished_synchronize_group_peer_id_list) => {
                      if(error) {
                        // Do nothing.
                      }
                    };

                    this._channel.broadcastSynchronize(Buf.concat([
                      this._ProtocolCodes.update_handshake,
                      target_group_peer_id_4bytes,
                      data_bytes.slice(1)
                    ]), a_synchronize_acknowledgment_handler, synchronize_acknowledgment_finished_listener, acknowledge_finished_listener);
                  }
                  else {
                    response(this._worker_global_protocol_codes.reject);
                  }
                }
                else if(protocol_code_int === this._ProtocolCodes.operation_iterations_count_check_request_response[0]) {
                  // Updating.
                  if(this._state_int === 1 || this._state_int === 2) {
                    response(Buf.concat([
                      this._worker_global_protocol_codes.reject,
                      this._ProtocolCodes.updating_error
                    ]));
                  }
                  else if(this._on_duty_group_peer_id === this._my_group_peer_id && this._state_int === 0) {
                    const remote_operation_iterations_count = Buf.decodeUInt32BE(data_bytes.slice(1));
                    if(remote_operation_iterations_count === this._operation_iterations_count) {
                      response(this._worker_global_protocol_codes.accept);
                    }
                    else {
                      // Help restore.
                      response(Buf.concat([
                        this._worker_global_protocol_codes.accept,
                        Buf.encodeUInt32BE(this._operation_iterations_count),
                        this._nsdt_embedded_protocol_encode(this._variable_value_nsdt)
                      ]));
                    }
                  }
                  else {
                    response(this._worker_global_protocol_codes.reject);
                  }
                }
              });

              this._channel.on('handshake', (group_peer_id, synchronize_message_bytes, synchronize_acknowledgment) => {
                const protocol_code_int = synchronize_message_bytes[0];
                if(protocol_code_int === this._ProtocolCodes.update_handshake[0]) {
                  if(group_peer_id === this._on_duty_group_peer_id) {
                    const target_group_peer_id = Buf.decodeUInt32BE(synchronize_message_bytes.slice(1, 5));
                    const variable_value_nsdt = this._nsdt_embedded_protocol_decode(target_group_peer_id, synchronize_message_bytes.slice(5));
                    // Change it to updating state
                    this._state_int = 1;
                    synchronize_acknowledgment(this._worker_global_protocol_codes.accept, (synchronize_acknowledgment_error, acknowledge_message_bytes) => {
                      if(synchronize_acknowledgment_error) {
                        return;
                      }
                      else if (acknowledge_message_bytes[0] === this._worker_global_protocol_codes.accept[0]) {
                        // Prevent overwrite the peer that request update.
                        if(target_group_peer_id !== this._my_group_peer_id) {
                          this._variable_value_nsdt = variable_value_nsdt;
                          this._on_duty_group_peer_id = target_group_peer_id;
                          this._operation_iterations_count += 1;
                          // Change it to ready state.
                          this._state_int = 0;
                        }
                        this.emitEventListener('update', target_group_peer_id, variable_value_nsdt);
                      }
                      else {
                        // Change it to ready state.
                        this._state_int = 0;
                        return;
                      }
                    });
                  }
                  else {
                    synchronize_acknowledgment(this._worker_global_protocol_codes.reject, (synchronize_acknowledgment_error, acknowledge_message_bytes) => {
                      return;
                    });
                  }
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
  if(this._event_listener_dict[event_name]) return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = {
  register_code: 1,
  module: Variable
};

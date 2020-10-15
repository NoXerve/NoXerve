/**
 * @file NoXerveAgent worker_socket protocol file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerSocketProtocol
 * @description Subprotocol of worker.
 */

const Utils = require('../../../../../utils');
const Buf = require('../../../../../buffer');
const WorkerSocket = require('./worker_socket');
const WorkerSocketManager = require('./manager');

/**
 * @constructor module:WorkerSocketProtocol
 * @param {object} settings
 */

function WorkerSocketProtocol(settings) {
  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;
  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_protocol_actions = settings.worker_protocol_actions;

  /**
   * @memberof module:WorkerSocketProtocol
   * @type {object}
   * @private
   */
  this._worker_socket_manager = new WorkerSocketManager();

}


/**
 * @memberof module:WorkerSocketProtocol
 * @type {object}
 * @private
 */
WorkerSocketProtocol.prototype._ProtocolCodes = {
  function_call: Buf.from([0x01]),
  function_call_data: Buf.from([0x02]),
  function_call_data_acknowledge: Buf.from([0x03]),
  function_call_data_eof: Buf.from([0x04]),
  function_call_error: Buf.from([0x05]),

  yielding_start: Buf.from([0x06]),
  yielding_start_acknowledge: Buf.from([0x07]),
  yielding_start_yield_data: Buf.from([0x08]),
  yielding_start_yield_data_acknowledge: Buf.from([0x09]),
  yielding_start_yield_data_eof: Buf.from([0x0a]),
  yielding_start_error: Buf.from([0x0b]),

  nsdt_embedded: Buf.from([0x0c]),
};

/**
 * @callback module:WorkerSocketProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerSocketProtocol
 * @param {module:WorkerSocketProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerSocketProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:WorkerSocketProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerSocketProtocol
 * @param {module:WorkerSocketProtocol~callback_of_start} callback
 * @description Start running WorkerSocketProtocol.
 */
WorkerSocketProtocol.prototype.start = function(callback) {
  this._worker_socket_manager.on('hash-string-request', (string) => {
    this._hash_manager.hashString4Bytes(string);
  });
  this._worker_socket_manager.on('worker-socket-create-request', // Create worker socket.
  (worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, inner_callback) => {
    const worker_socket_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_socket_purpose_name);
    const worker_socket_purpose_parameter_bytes = this._nsdt_embedded_protocol.encode(worker_socket_purpose_parameter);
    const my_worker_authenticity_bytes = this._worker_protocol_actions.encodeAuthenticityBytes();

    const synchronize_information = Buf.concat([
      Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
      my_worker_authenticity_bytes,
      worker_socket_purpose_name_4bytes,
      worker_socket_purpose_parameter_bytes
    ]);

    let _is_authenticity_valid = false;

    const synchronize_acknowledgment = (open_handshanke_error, synchronize_acknowledgment_information, next) => {
      if (open_handshanke_error) {
        inner_callback(open_handshanke_error);
        next(false);
      } else if (synchronize_acknowledgment_information[0] === this._worker_global_protocol_codes.accept[0]) {
        const remote_worker_peer_authenticity_bytes = synchronize_acknowledgment_information.slice(1);
        // Auth remote worker.
        this._worker_protocol_actions.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
          _is_authenticity_valid = is_authenticity_valid;
          if (is_authenticity_valid && !error) {
            next(this._worker_global_protocol_codes.accept); // Accept.
          } else {
            next(this._worker_global_protocol_codes.authentication_reason_reject_2_bytes); // Reject. Authenticication error.
          }
        });
      } else if (synchronize_acknowledgment_information[0] === this._worker_global_protocol_codes.reject[0]
      ) {
        if (synchronize_acknowledgment_information[1] === this._worker_global_protocol_codes.authentication_reason_reject_2_bytes[1]) {
          inner_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'));
          next(false);

        } else {
          inner_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'));
          next(false);
        }
      } else {
        inner_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'));
        next(false);
      }
    };

    const finish_handshake = (error, tunnel) => {
      if (error) {
        inner_callback(error);
      } else {
        if (_is_authenticity_valid) {
          const worker_socket = new WorkerSocket();
          this._setupTunnel(error, worker_socket, tunnel);
          inner_callback(error, worker_socket);
        } else {
          inner_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Remote worker authentication failed.'));
        }
      }
    };

    this._worker_protocol_actions.openHandshakeByWorkerId(remote_worker_peer_worker_id, synchronize_information, synchronize_acknowledgment, finish_handshake);
  });
  callback(false, this._worker_socket_manager);
}

/**
 * @memberof module:WorkerSocketProtocol
 * @param {error} error - If worker socket module create worker_socket failed or not.
 * @param {object} worker_socket
 * @param {tunnel} tunnel
 * @description Method that handle worker socket of worker socket protocol from worker socket protocol module.
 */
WorkerSocketProtocol.prototype._setupTunnel = function(error, worker_socket, tunnel) {
  if (error) tunnel.close();
  else {
    this._nsdt_embedded_protocol.createRuntimeProtocol((error, nsdt_embedded_protocol_encode, nsdt_embedded_protocol_decode, nsdt_on_data, nsdt_emit_data, nsdt_embedded_protocol_destroy) => {
      if (error) tunnel.close();
      else {
        // nsdt embedded runtime protocol setup.
        nsdt_on_data((data) => {
          tunnel.send(Buf.concat([
            this._ProtocolCodes.nsdt_embedded,
            data
          ]));
        });

        // For function-define and yielding-handle.
        let yielding_handler_dict = {};

        let function_call_data_acknowledgment_callbacks = {};

        // For function-call and yielding-start.
        let function_call_callback_dict = {};
        let yielding_start_callback_dict = {};
        let yielding_start_data_acknowledgment_callbacks = {};

        // Hash worker socket function name.
        worker_socket.on('function-define', (function_name) => {
          this._hash_manager.hashString4Bytes(function_name);
        });

        // Start communication with another worker.
        worker_socket.on('function-call',
          (function_name, function_argument, function_call_callback) => {
            const function_call_callback_id = Utils.random4Bytes();

            // Register callback with callback id locally.
            function_call_callback_dict[function_call_callback_id.toString('base64')] = function_call_callback;

            // WorkerSocket Protocol type "function-call"
            tunnel.send(Buf.concat([
              this._ProtocolCodes.function_call,
              this._hash_manager.hashString4Bytes(function_name),
              function_call_callback_id,
              nsdt_embedded_protocol_encode(function_argument)
            ]));
          }
        );

        // Hash worker socket function name.
        worker_socket.on('yielding-handle', (field_name) => {
          this._hash_manager.hashString4Bytes(field_name);
        });

        // Start communication with another worker.
        worker_socket.on('yielding-start', (field_name, yielding_start_argument, yielding_start_callback) => {
          const yielding_start_id = Utils.random4Bytes();

          // Register callback with callback id locally.
          yielding_start_callback_dict[yielding_start_id.toString('base64')] = yielding_start_callback;

          // WorkerSocket Protocol type "yielding-start"
          tunnel.send(Buf.concat([
            this._ProtocolCodes.yielding_start,
            this._hash_manager.hashString4Bytes(field_name),
            yielding_start_id,
            nsdt_embedded_protocol_encode(yielding_start_argument)
          ]));
        });

        // Close communication with another worker.
        worker_socket.on('initiative-close', (callback) => {
          tunnel.close(callback);
        });

        tunnel.on('data', (data) => {

          const protocol_code = data[0];
          data = data.slice(1);

          if(protocol_code === this._ProtocolCodes.nsdt_embedded[0]) {
            nsdt_emit_data(data);
          }

          // WorkerSocket Protocol type "function-call"
          else if (protocol_code === this._ProtocolCodes.function_call[0]) {
            let function_call_callback_id;
            let function_call_callback_id_base64;

            // Important value. Calculate first.
            try {
              function_call_callback_id = data.slice(4, 8);
              function_call_callback_id_base64 = function_call_callback_id.toString('base64');
            } catch (e) {}
            // Catch error.
            try {
              const function_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
              const function_parameter = nsdt_embedded_protocol_decode(data.slice(8));
              if(function_call_callback_id) function_call_data_acknowledgment_callbacks[function_call_callback_id_base64] = {};

              const return_function = (data) => {
                // No longer need keep tracking acknowledgment.
                delete function_call_data_acknowledgment_callbacks[function_call_callback_id_base64];

                // WorkerSocket Protocol type "function_call_data"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data_eof,
                  function_call_callback_id,
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              let acknowledgment_id_enumerated = 0;

              const yield_function = (data, acknowledgment_callback) => {
                let acknowledgment_id = 0;
                if(acknowledgment_callback) {
                  acknowledgment_id_enumerated++;
                  acknowledgment_id = acknowledgment_id_enumerated;
                  function_call_data_acknowledgment_callbacks[function_call_callback_id_base64][acknowledgment_id] = acknowledgment_callback;
                }

                // WorkerSocket Protocol type "function_call_data"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data,
                  function_call_callback_id,
                  Buf.encodeUInt32BE(acknowledgment_id),
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              worker_socket.emitEventListener('function-call-request',
                function_name,
                function_parameter,
                return_function,
                yield_function
              );
            } catch (error) {
              console.log(error);
              delete function_call_data_acknowledgment_callbacks[function_call_callback_id_base64];
              tunnel.send(Buf.concat([
                this._ProtocolCodes.function_call_error,
                function_call_callback_id
              ]));
            }
          } else if (protocol_code === this._ProtocolCodes.function_call_data_acknowledge[0]) {
            const function_call_callback_id_base64 = data.slice(0, 4).toString('base64');
            const acknowledgment_id = Buf.decodeUInt32BE(data.slice(4, 8));
            const acknowledgment_information = nsdt_embedded_protocol_decode(data.slice(8));
            try {
              function_call_data_acknowledgment_callbacks[function_call_callback_id_base64][acknowledgment_id](acknowledgment_information);
              if(function_call_data_acknowledgment_callbacks[function_call_callback_id_base64]) delete function_call_data_acknowledgment_callbacks[function_call_callback_id_base64][acknowledgment_id];
            }
            catch(error) {
              console.log(error);
            }
          } else if (protocol_code === this._ProtocolCodes.yielding_start[0]) {
            let yielding_start_id;
            // Important value. Calculate first.
            try {
              yielding_start_id = data.slice(4, 8);
            } catch (e) {}
            // Catch error.
            try {
              const yielding_start_id_base64 = yielding_start_id.toString('base64');
              const field_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
              const yielding_handler_parameter = nsdt_embedded_protocol_decode(data.slice(8));

              worker_socket.emitEventListener('yielding-start-request', field_name, yielding_handler_parameter, (yielding_handler_argument, yielding_handler) => {
                yielding_handler_dict[yielding_start_id_base64] = yielding_handler;

                // WorkerSocket Protocol type "yielding_start_acknowledge"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_acknowledge,
                  yielding_start_id,
                  nsdt_embedded_protocol_encode(yielding_handler_argument)
                ]));
              });
            } catch (error) {
              tunnel.send(Buf.concat([
                this._ProtocolCodes.yielding_start_error,
                yielding_start_id
              ]));
            }

          } else if (protocol_code === this._ProtocolCodes.yielding_start_yield_data[0]) {
            const yielding_start_id = data.slice(0, 4);
            const yielding_start_id_base64 = yielding_start_id.toString('base64');
            const acknowledgment_id = data.slice(4, 8);
            const yielded_data = nsdt_embedded_protocol_decode(data.slice(8));
            let acknowledge_function;

            // Generate acknowledge_function
            if(Buf.decodeUInt32BE(acknowledgment_id) !== 0) {
              acknowledge_function = (acknowledgment_information) => {
                // acknowledgment_information is nsdt supported.
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data_acknowledge,
                  yielding_start_id,
                  acknowledgment_id,
                  nsdt_embedded_protocol_encode(acknowledgment_information)
                ]));
              };
            }

            yielding_handler_dict[yielding_start_id.toString('base64')](false, yielded_data, false, acknowledge_function);

          } else if (protocol_code === this._ProtocolCodes.yielding_start_yield_data_eof[0]) {
            const yielding_start_id = data.slice(0, 4);
            const yielding_start_id_base64 = data.slice(0, 4).toString('base64');
            const yielded_data = nsdt_embedded_protocol_decode(data.slice(4));

            yielding_handler_dict[yielding_start_id_base64](false, yielded_data, true);

            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_start_id_base64];

          } else if (protocol_code === this._ProtocolCodes.yielding_start_error[0]) {
            const yielding_start_id = data.slice(0, 4);
            const yielding_start_id_base64 = yielding_start_id.toString('base64');
            yielding_handler_dict[yielding_start_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Yielding protocol error.'), null, true);

            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_start_id_base64];

          } else if (protocol_code === this._ProtocolCodes.function_call_data[0]) {
            const function_call_callback_id = data.slice(0, 4);
            const function_call_callback_id_base64 = function_call_callback_id.toString('base64');
            const acknowledgment_id = data.slice(4, 8);
            const function_yielded_data = nsdt_embedded_protocol_decode(data.slice(8));
            let acknowledge_function;

            // Generate acknowledge_function
            if(Buf.decodeUInt32BE(acknowledgment_id) !== 0) {
              acknowledge_function = (acknowledgment_information) => {
                // acknowledgment_information is nsdt supported.
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data_acknowledge,
                  function_call_callback_id,
                  acknowledgment_id,
                  nsdt_embedded_protocol_encode(acknowledgment_information)
                ]));
              };
            }

            function_call_callback_dict[function_call_callback_id.toString('base64')](false, function_yielded_data, false, acknowledge_function);

            // Handle worker function call error.
          } else if (protocol_code === this._ProtocolCodes.function_call_data_eof[0]) {
            const function_call_callback_id = data.slice(0, 4);
            const function_call_callback_id_base64 = function_call_callback_id.toString('base64');
            const function_yielded_data = nsdt_embedded_protocol_decode(data.slice(4));

            function_call_callback_dict[function_call_callback_id_base64](false, function_yielded_data, true);

            // EOF, delete the callback no longer useful.
            delete function_call_callback_dict[function_call_callback_id_base64];

          } else if (protocol_code === this._ProtocolCodes.function_call_error[0]) {
            const function_call_callback_id = data.slice(0, 4);
            const function_call_callback_id_base64 = function_call_callback_id.toString('base64');

            function_call_callback_dict[function_call_callback_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker function call error.'), null, true);

            // EOF, delete the callback no longer useful.
            delete function_call_callback_dict[function_call_callback_id_base64];

            // WorkerSocket Protocol type "yielding_start_acknowledge"
          } else if (protocol_code === this._ProtocolCodes.yielding_start_acknowledge[0]) {
            let yielding_start_id;
            let yielding_start_id_base64;

            // Important value. Calculate first.
            try {
              yielding_start_id = data.slice(0, 4);
              yielding_start_id_base64 = yielding_start_id.toString('base64');
            } catch (e) {}
            // Catch error.
            try {
              const yielding_start_parameter = nsdt_embedded_protocol_decode(data.slice(4));
              if(yielding_start_id) yielding_start_data_acknowledgment_callbacks[yielding_start_id_base64] = {};

              const finish_yield_function = (data) => {

                // No longer need keep tracking acknowledgment.
                delete yielding_start_data_acknowledgment_callbacks[yielding_start_id_base64];

                // WorkerSocket Protocol type "yielding_data_eof".
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data_eof,
                  yielding_start_id,
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              let acknowledgment_id_enumerated = 0;

              const yield_data_function = (data, acknowledgment_callback) => {
                let acknowledgment_id = 0;
                if(acknowledgment_callback) {
                  acknowledgment_id_enumerated++;
                  acknowledgment_id = acknowledgment_id_enumerated;
                  yielding_start_data_acknowledgment_callbacks[yielding_start_id_base64][acknowledgment_id] = acknowledgment_callback;
                }

                // WorkerSocket Protocol type "yielding_data".
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data,
                  yielding_start_id,
                  Buf.encodeUInt32BE(acknowledgment_id),
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              yielding_start_callback_dict[yielding_start_id_base64](
                false,
                yielding_start_parameter,
                finish_yield_function,
                yield_data_function
              );

            } catch (error) {
              console.log(error);
              delete yielding_start_data_acknowledgment_callbacks[yielding_start_id_base64];
              tunnel.send(Buf.concat([
                this._ProtocolCodes.yielding_start_error,
                yielding_start_id
              ]));
            }

          } else if (protocol_code === this._ProtocolCodes.yielding_start_yield_data_acknowledge[0]) {
            const yielding_start_callback_id_base64 = data.slice(0, 4).toString('base64');
            const acknowledgment_id = Buf.decodeUInt32BE(data.slice(4, 8));
            const acknowledgment_information = nsdt_embedded_protocol_decode(data.slice(8));
            try {
              yielding_start_data_acknowledgment_callbacks[yielding_start_callback_id_base64][acknowledgment_id](acknowledgment_information);
              if(yielding_start_data_acknowledgment_callbacks[yielding_start_callback_id_base64]) delete yielding_start_data_acknowledgment_callbacks[yielding_start_callback_id_base64][acknowledgment_id];
            }
            catch(error) {
              console.log(error);
            }
          } else if (protocol_code === this._ProtocolCodes.yielding_start_error[0]) {
            const yielding_start_id = data.slice(0, 4);
            const yielding_start_id_base64 = data.slice(0, 4).toString('base64');

            yielding_start_callback_dict[yielding_start_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Yielding request error.'));
            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_start_id_base64];
          }
        });

        tunnel.on('error', (error) => {
          worker_socket.emitEventListener('externel-error');
        });

        tunnel.on('close', () => {
          worker_socket.emitEventListener('passively-close');
          nsdt_embedded_protocol_destroy();
        });
      }
    });
  }
}

/**
 * @callback module:WorkerSocketProtocol~callback_of_next
 * @param {buffer} synchronize_returned_data
 */
/**
 * @memberof module:WorkerSocketProtocol
 * @param {buffer} synchronize_information
 * @param {function} onError
 * @param {function} onAcknowledge
 * @param {module:WorkerSocketProtocol~callback_of_next} next
 * @description Synchronize handshake from remote emitter.
 */
WorkerSocketProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {
  const worker_id = Buf.decodeUInt32BE(synchronize_information.slice(0, 4));
  const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(0, 4));

  onError((error) => {
    // Server side error.
    console.log(error);
  });

  this._worker_protocol_actions.validateAuthenticityBytes(synchronize_information.slice(4, 4 + remote_worker_peer_authenticity_bytes_length), (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
    if (is_authenticity_valid && !error) {
      const register_code_1byte = null;
      const worker_socket_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_information.slice(4 + remote_worker_peer_authenticity_bytes_length, 4 + remote_worker_peer_authenticity_bytes_length + 4));
      const worker_socket_purpose_parameter = this._nsdt_embedded_protocol.decode(synchronize_information.slice(4 + remote_worker_peer_authenticity_bytes_length + 4));
      // console.log(is_authenticity_valid, remote_worker_peer_worker_id, remote_worker_peer_authenticity_bytes_length, remote_worker_peer_authenticity_bytes, worker_socket_purpose_name, worker_socket_purpose_parameter);

      onAcknowledge((acknowledge_information, tunnel) => {
        if (acknowledge_information[0] === this._worker_global_protocol_codes.accept[0]) {
          const worker_socket = new WorkerSocket();
          this._setupTunnel(error, worker_socket, tunnel);
          this._worker_socket_manager.emitEventListener('worker-socket-create-' + worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, worker_socket);
        } else {
          tunnel.close();
        }
      });

      next(Buf.concat([
        this._worker_global_protocol_codes.accept, // Accept.
        this._worker_protocol_actions.encodeAuthenticityBytes()
      ]));

    } else {
      onAcknowledge((acknowledge_information, tunnel) => {
        // Reject.
        tunnel.close();
      });
      next(this._worker_global_protocol_codes.authentication_reason_reject_2_bytes); // Reject. Authenticication error.
    }
  });
}

module.exports = {
  protocol_name: 'worker_socket',
  protocol_code: Buf.from([0x00]),
  module: WorkerSocketProtocol
};

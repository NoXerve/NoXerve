/**
 * @file NoXerveAgent worker_socket protocol index file. [worker_socket.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerSocketProtocol
 * @description Subprotocol of worker.
 */

const Utils = require('../../../../utils');
const Buf = require('../../../../buffer');
const Crypto = require('crypto');

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
   * @memberof module:ActivityOfServiceProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:ActivityOfServiceProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;
}


/**
 * @memberof module:WorkerSocketProtocol
 * @type {object}
 * @private
 */
WorkerSocketProtocol.prototype._ProtocolCodes = {
  function_call: Buf.from([0x01]),
  function_call_data: Buf.from([0x02]),
  function_call_data_eof: Buf.from([0x03]),
  function_call_error: Buf.from([0x04]),
  yielding_start: Buf.from([0x05]),
  yielding_start_acknowledge: Buf.from([0x06]),
  yielding_data: Buf.from([0x07]),
  yielding_data_eof: Buf.from([0x08]),
  yielding_error: Buf.from([0x09]),
  nsdt_embedded: Buf.from([0x0a]),
};

/**
 * @memberof module:WorkerSocketProtocol
 * @param {error} error - If worker socket module create worker_socket failed or not.
 * @param {object} worker_socket
 * @param {tunnel} tunnel
 * @description Method that handle worker socket of worker socket protocol from worker socket protocol module.
 */
WorkerSocketProtocol.prototype.handleTunnel = function(error, worker_socket, tunnel) {
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

        // For function-call and yielding-start.
        let function_callback_dict = {};
        let yielding_start_callback_dict = {};

        // Hash worker socket function name.
        worker_socket.on('function-define', (function_name) => {
          this._hash_manager.hashString4Bytes(function_name);
        });

        // Start communication with another worker.
        worker_socket.on('function-call',
          (function_name, function_argument, function_callback) => {
            const function_callback_id = Utils.random4Bytes();

            // Register callback with callback id locally.
            function_callback_dict[function_callback_id.toString('base64')] = function_callback;

            // WorkerSocket Protocol type "function-call" code 0x01
            // format:
            // +1 | +4 | +4 | ~
            // protocol_code, function_name, function_callback_id, NSDT_encoded
            tunnel.send(Buf.concat([
              this._ProtocolCodes.function_call,
              this._hash_manager.hashString4Bytes(function_name),
              function_callback_id,
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
          const yielding_id = Utils.random4Bytes();

          // Register callback with callback id locally.
          yielding_start_callback_dict[yielding_id.toString('base64')] = yielding_start_callback;

          // WorkerSocket Protocol type "yielding-start"
          // format:
          // +1 | +4 | +4 | ~
          // protocol_code, field_name, yielding_id, NSDT_encoded
          tunnel.send(Buf.concat([
            this._ProtocolCodes.yielding_start,
            this._hash_manager.hashString4Bytes(field_name),
            yielding_id,
            nsdt_embedded_protocol_encode(yielding_start_argument)
          ]));
        });

        // Close communication with another worker.
        worker_socket.on('initiative-close', (callback) => {
          tunnel.close(callback);
        });

        tunnel.on('data', (data) => {
          // code | type
          // 0x01 function-call

          const protocol_code = data[0];
          data = data.slice(1);

          if(protocol_code === this._ProtocolCodes.nsdt_embedded[0]) {
            nsdt_emit_data(data);
          }
          // WorkerSocket Protocol type "function-call" code 0x01
          // format:
          // +1 | +4 | +4 | ~
          // protocol_code, function_name, function_callback_id, NSDT_encoded
          else if (protocol_code === this._ProtocolCodes.function_call[0]) {
            let function_callback_id;
            // Important value. Calculate first.
            try {
              function_callback_id = data.slice(4, 8);
            } catch (e) {}
            // Catch error.
            try {
              const function_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
              const function_parameter = nsdt_embedded_protocol_decode(data.slice(8));

              const return_function = (data) => {
                // WorkerSocket Protocol type "function_call_data" code 0x02
                // format:
                // +1 | +4 | ~
                // function_call_data, function_callback_id, NSDT_encoded

                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data_eof,
                  function_callback_id, nsdt_embedded_protocol_encode(data)
                ]));
              };

              const yield_function = (data) => {
                // WorkerSocket Protocol type "function_call_data" code 0x03
                // format:
                // +1 | +4 | ~
                // function_call_data, function_callback_id, NSDT_encoded

                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data,
                  function_callback_id, nsdt_embedded_protocol_encode(data)
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
              tunnel.send(Buf.concat([
                this._ProtocolCodes.function_call_error,
                function_callback_id
              ]));
            }
          } else if (protocol_code === this._ProtocolCodes.yielding_start[0]) {
            let yielding_id;
            // Important value. Calculate first.
            try {
              yielding_id = data.slice(4, 8);
            } catch (e) {}
            // Catch error.
            try {
              const yielding_id_base64 = yielding_id.toString('base64');
              const field_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
              const yielding_handler_parameter = nsdt_embedded_protocol_decode(data.slice(8));

              worker_socket.emitEventListener('yielding-start-request', field_name, yielding_handler_parameter, (yielding_handler_argument, yielding_handler) => {
                yielding_handler_dict[yielding_id_base64] = yielding_handler;
                // WorkerSocket Protocol type "yielding_start_acknowledge"
                // format:
                // +1 | +4 | ~
                // function_call_data, function_callback_id, NSDT_encoded

                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_acknowledge,
                  yielding_id,
                  nsdt_embedded_protocol_encode(yielding_handler_argument)
                ]));
              });
            } catch (error) {
              tunnel.send(Buf.concat([
                this._ProtocolCodes.yielding_error,
                yielding_id
              ]));
            }
          } else if (protocol_code === this._ProtocolCodes.yielding_data[0]) {
            const yielding_id = data.slice(0, 4);
            const yielded_data = nsdt_embedded_protocol_decode(data.slice(4));

            yielding_handler_dict[yielding_id.toString('base64')](false, yielded_data, false);
          } else if (protocol_code === this._ProtocolCodes.yielding_data_eof[0]) {
            const yielding_id = data.slice(0, 4);
            const yielding_id_base64 = data.slice(0, 4).toString('base64');
            const yielded_data = nsdt_embedded_protocol_decode(data.slice(4));

            yielding_handler_dict[yielding_id_base64](false, yielded_data, true);
            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_id_base64];
          } else if (protocol_code === this._ProtocolCodes.yielding_error[0]) {
            const yielding_id = data.slice(0, 4);
            const yielding_id_base64 = yielding_id.toString('base64');

            yielding_handler_dict[yielding_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Yielding protocol error.'), null, true);
            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_id_base64];

          } else if (protocol_code === this._ProtocolCodes.function_call_data_eof[0]) {
            const function_callback_id = data.slice(0, 4);
            const function_yielded_data = nsdt_embedded_protocol_decode(data.slice(4));
            const function_callback_id_base64 = function_callback_id.toString('base64');

            function_callback_dict[function_callback_id_base64](false, function_yielded_data, true);

            // EOF, delete the callback no longer useful.
            delete function_callback_dict[function_callback_id_base64];

          } else if (protocol_code === this._ProtocolCodes.function_call_data[0]) {
            const function_callback_id = data.slice(0, 4);
            const function_yielded_data = nsdt_embedded_protocol_decode(data.slice(4));
            function_callback_dict[function_callback_id.toString('base64')](false, function_yielded_data, false);

            // Handle worker function call error.
          } else if (protocol_code === this._ProtocolCodes.function_call_error[0]) {
            const function_callback_id = data.slice(0, 4);
            const function_callback_id_base64 = function_callback_id.toString('base64');

            function_callback_dict[function_callback_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker function call error.'), null, true);

            // EOF, delete the callback no longer useful.
            delete function_callback_dict[function_callback_id_base64];

            // WorkerSocket Protocol type "yielding_start_acknowledge"
            // format:
            // +1 | +4 | ~
            // function_call_data, function_callback_id, NSDT_encoded
          } else if (protocol_code === this._ProtocolCodes.yielding_start_acknowledge[0]) {
            let yielding_id;
            // Important value. Calculate first.
            try {
              yielding_id = data.slice(0, 4);
            } catch (e) {}
            // Catch error.
            try {
              const yielding_start_parameter = nsdt_embedded_protocol_decode(data.slice(4));

              const finish_yield_function = (data) => {
                // WorkerSocket Protocol type "yielding_data_eof".
                // format:
                // +1 | +4 | ~
                // function_call_data, yielding_id, NSDT_encoded

                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_data_eof,
                  yielding_id, nsdt_embedded_protocol_encode(data)
                ]));
              };

              const yield_data_function = (data) => {
                // WorkerSocket Protocol type "yielding_data".
                // format:
                // +1 | +4 | ~
                // function_call_data, yielding_id, NSDT_encoded

                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_data,
                  yielding_id, nsdt_embedded_protocol_encode(data)
                ]));
              };

              yielding_start_callback_dict[yielding_id.toString('base64')](
                false,
                yielding_start_parameter,
                finish_yield_function,
                yield_data_function
              );

            } catch (error) {
              tunnel.send(Buf.concat([
                this._ProtocolCodes.yielding_error,
                yielding_id
              ]));
            }

          } else if (protocol_code === this._ProtocolCodes.yielding_error[0]) {
            const yielding_id = data.slice(0, 4);
            const yielding_id_base64 = data.slice(0, 4).toString('base64');

            yielding_start_callback_dict[yielding_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Yielding request error.'));
            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_id_base64];
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

module.exports = WorkerSocketProtocol;

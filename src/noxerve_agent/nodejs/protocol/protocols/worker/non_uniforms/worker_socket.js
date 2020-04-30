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

        let function_call_data_acknowledgement_callbacks = {};

        // For function-call and yielding-start.
        let function_call_callback_dict = {};
        let yielding_start_callback_dict = {};
        let yielding_start_data_acknowledgement_callbacks = {};

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
              if(function_call_callback_id) function_call_data_acknowledgement_callbacks[function_call_callback_id_base64] = {};

              const return_function = (data) => {
                // No longer need keep tracking acknowledgement.
                delete function_call_data_acknowledgement_callbacks[function_call_callback_id_base64];

                // WorkerSocket Protocol type "function_call_data"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data_eof,
                  function_call_callback_id,
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              let acknowledgement_id_enumerated = 0;

              const yield_function = (data, acknowledgement_callback) => {
                let acknowledgement_id = 0;
                if(acknowledgement_callback) {
                  acknowledgement_id_enumerated++;
                  acknowledgement_id = acknowledgement_id_enumerated;
                  function_call_data_acknowledgement_callbacks[function_call_callback_id_base64][acknowledgement_id] = acknowledgement_callback;
                }

                // WorkerSocket Protocol type "function_call_data"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data,
                  function_call_callback_id,
                  Buf.encodeUInt32BE(acknowledgement_id),
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
              delete function_call_data_acknowledgement_callbacks[function_call_callback_id_base64];
              tunnel.send(Buf.concat([
                this._ProtocolCodes.function_call_error,
                function_call_callback_id
              ]));
            }
          } else if (protocol_code === this._ProtocolCodes.function_call_data_acknowledge[0]) {
            const function_call_callback_id_base64 = data.slice(0, 4).toString('base64');
            const acknowledgement_id = Buf.decodeUInt32BE(data.slice(4, 8));
            const acknowledgement_information = nsdt_embedded_protocol_decode(data.slice(8));
            try {
              function_call_data_acknowledgement_callbacks[function_call_callback_id_base64][acknowledgement_id](acknowledgement_information);
              if(function_call_data_acknowledgement_callbacks[function_call_callback_id_base64]) delete function_call_data_acknowledgement_callbacks[function_call_callback_id_base64][acknowledgement_id];
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
            const acknowledgement_id = data.slice(4, 8);
            const yielded_data = nsdt_embedded_protocol_decode(data.slice(8));
            let acknowledge_function;

            // Generate acknowledge_function
            if(Buf.decodeUInt32BE(acknowledgement_id) !== 0) {
              acknowledge_function = (acknowledgement_information) => {
                // acknowledgement_information is nsdt supported.
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data_acknowledge,
                  yielding_start_id,
                  acknowledgement_id,
                  nsdt_embedded_protocol_encode(acknowledgement_information)
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
            const acknowledgement_id = data.slice(4, 8);
            const function_yielded_data = nsdt_embedded_protocol_decode(data.slice(8));
            let acknowledge_function;

            // Generate acknowledge_function
            if(Buf.decodeUInt32BE(acknowledgement_id) !== 0) {
              acknowledge_function = (acknowledgement_information) => {
                // acknowledgement_information is nsdt supported.
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.function_call_data_acknowledge,
                  function_call_callback_id,
                  acknowledgement_id,
                  nsdt_embedded_protocol_encode(acknowledgement_information)
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
              if(yielding_start_id) yielding_start_data_acknowledgement_callbacks[yielding_start_id_base64] = {};

              const finish_yield_function = (data) => {

                // No longer need keep tracking acknowledgement.
                delete yielding_start_data_acknowledgement_callbacks[yielding_start_id_base64];

                // WorkerSocket Protocol type "yielding_data_eof".
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data_eof,
                  yielding_start_id,
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              let acknowledgement_id_enumerated = 0;

              const yield_data_function = (data, acknowledgement_callback) => {
                let acknowledgement_id = 0;
                if(acknowledgement_callback) {
                  acknowledgement_id_enumerated++;
                  acknowledgement_id = acknowledgement_id_enumerated;
                  yielding_start_data_acknowledgement_callbacks[yielding_start_id_base64][acknowledgement_id] = acknowledgement_callback;
                }

                // WorkerSocket Protocol type "yielding_data".
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data,
                  yielding_start_id,
                  Buf.encodeUInt32BE(acknowledgement_id),
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
              delete yielding_start_data_acknowledgement_callbacks[yielding_start_id_base64];
              tunnel.send(Buf.concat([
                this._ProtocolCodes.yielding_start_error,
                yielding_start_id
              ]));
            }

          } else if (protocol_code === this._ProtocolCodes.yielding_start_yield_data_acknowledge[0]) {
            const yielding_start_callback_id_base64 = data.slice(0, 4).toString('base64');
            const acknowledgement_id = Buf.decodeUInt32BE(data.slice(4, 8));
            const acknowledgement_information = nsdt_embedded_protocol_decode(data.slice(8));
            try {
              yielding_start_data_acknowledgement_callbacks[yielding_start_callback_id_base64][acknowledgement_id](acknowledgement_information);
              if(yielding_start_data_acknowledgement_callbacks[yielding_start_callback_id_base64]) delete yielding_start_data_acknowledgement_callbacks[yielding_start_callback_id_base64][acknowledgement_id];
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

module.exports = WorkerSocketProtocol;
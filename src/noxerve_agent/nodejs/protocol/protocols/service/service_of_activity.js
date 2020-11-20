/**
 * @file NoXerveAgent service protocol service_of_activity_handler file. [service_of_activity_handler.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceOfActivityProtocol
 * @description Service has properties to be take advantage of, by using prototype.
 * They can share hash results. etc.
 */

const Utils = require('../../../utils');
const Buf = require('../../../buffer');
const Errors = require('../../../errors');

/**
 * @constructor module:ServiceOfActivityProtocol
 * @param {object} settings
 * @description Service has properties to be take advantage of, by using prototype.
 * They can share hash results. etc.
 */
function ServiceOfActivityProtocol(settings) {
  /**
   * @memberof module:ServiceOfActivityProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ServiceOfActivityProtocol
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
 * @memberof module:ServiceOfActivityProtocol
 * @type {object}
 * @private
 */
ServiceOfActivityProtocol.prototype._ProtocolCodes = {
  service_function_call: Buf.from([0x01]),
  service_function_call_data: Buf.from([0x02]),
  service_function_call_data_acknowledge: Buf.from([0x03]),
  service_function_call_data_eof: Buf.from([0x04]),
  service_function_call_error: Buf.from([0x05]),

  yielding_start: Buf.from([0x06]),
  yielding_start_acknowledge: Buf.from([0x07]),
  yielding_start_yield_data: Buf.from([0x08]),
  yielding_start_yield_data_acknowledge: Buf.from([0x09]),
  yielding_start_yield_data_eof: Buf.from([0x0a]),
  yielding_start_error: Buf.from([0x0b]),

  nsdt_embedded: Buf.from([0x0c]),
};

// [Flag] Need to be rewrited.
/**
 * @memberof module:ServiceOfActivityProtocol
 * @param {error} error - If service module create service_of_activity failed or not.
 * @param {object} service_of_activity
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
ServiceOfActivityProtocol.prototype.handleTunnel = function(error, service_of_activity, tunnel) {
  if (error) tunnel.close();
  else {
    this._nsdt_embedded_protocol.createBidirectionalRuntimeProtocol((error, nsdt_embedded_protocol_encode, nsdt_embedded_protocol_decode, nsdt_on_data, nsdt_emit_data, nsdt_embedded_protocol_destroy)=> {
      if (error) tunnel.close();
      else {
        // nsdt embedded runtime protocol setup.
        nsdt_on_data((data) => {
          tunnel.send(Buf.concat([
            this._ProtocolCodes.nsdt_embedded,
            data
          ]));
        });

        // For start yielding call.
        let yielding_handler_dict = {};

        let service_function_call_data_acknowledgment_callbacks = {};

        // Hash service function name.
        service_of_activity.on('service-function-define', (service_function_name) => {
          this._hash_manager.hashString4Bytes(service_function_name);
        });

        // Hash service function name.
        service_of_activity.on('yielding-handle', (field_name) => {
          this._hash_manager.hashString4Bytes(field_name);
        });

        // Close communication with activity.
        service_of_activity.on('initiative-close', (callback) => {
          tunnel.close(callback);
        });

        tunnel.on('data', (data) => {
          // code | type
          // 0x01 service-function-call

          const protocol_code = data[0];
          data = data.slice(1);

          if(protocol_code === this._ProtocolCodes.nsdt_embedded[0]) {
            nsdt_emit_data(data);
          }

          // Service Protocol type "service-function-call"
          else if (protocol_code === this._ProtocolCodes.service_function_call[0]) {
            let service_function_call_callback_id;
            let service_function_call_callback_id_base64;

            // Important value. Calculate first.
            try {
              service_function_call_callback_id = data.slice(4, 8);
              service_function_call_callback_id_base64 = service_function_call_callback_id.toString('base64');
            } catch (e) {}
            // Catch error.
            try {
              const service_function_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
              const service_function_parameter = nsdt_embedded_protocol_decode(data.slice(8));
              if(service_function_call_callback_id) service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64] = {};

              const return_function = (data) => {

                // No longer need keep tracking acknowledgment.
                delete service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64];

                // Service Protocol type "service_function_call_data"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.service_function_call_data_eof,
                  service_function_call_callback_id,
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              let acknowledgment_id_enumerated = 0;

              const yield_function = (data, acknowledgment_callback) => {
                let acknowledgment_id = 0;
                if(acknowledgment_callback) {
                  acknowledgment_id_enumerated++;
                  acknowledgment_id = acknowledgment_id_enumerated;
                  service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64][acknowledgment_id] = acknowledgment_callback;
                }

                // Service Protocol type "service_function_call_data"
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.service_function_call_data,
                  service_function_call_callback_id,
                  Buf.encodeUInt32BE(acknowledgment_id),
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              service_of_activity.emitEventListener('service-function-call-request',
                service_function_name,
                service_function_parameter,
                return_function,
                yield_function
              );
            } catch (error) {
              console.log(error);
              delete service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64];
              tunnel.send(Buf.concat([
                this._ProtocolCodes.service_function_call_error,
                service_function_call_callback_id
              ]));
            }
          } else if (protocol_code === this._ProtocolCodes.service_function_call_data_acknowledge[0]) {
            const service_function_call_callback_id_base64 = data.slice(0, 4).toString('base64');
            const acknowledgment_id = Buf.decodeUInt32BE(data.slice(4, 8));
            const acknowledgment_information = nsdt_embedded_protocol_decode(data.slice(8));
            try {
              service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64][acknowledgment_id](acknowledgment_information);
              if(service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64]) delete service_function_call_data_acknowledgment_callbacks[service_function_call_callback_id_base64][acknowledgment_id];
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

              service_of_activity.emitEventListener('yielding-start-request', field_name, yielding_handler_parameter, (yielding_handler_argument, yielding_handler) => {
                yielding_handler_dict[yielding_start_id_base64] = yielding_handler;

                // Service Protocol type "yielding_start_acknowledge"
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

            yielding_handler_dict[yielding_start_id_base64](false, yielded_data, false, acknowledge_function);

          } else if (protocol_code === this._ProtocolCodes.yielding_start_yield_data_eof[0]) {
            const yielding_start_id = data.slice(0, 4);
            const yielding_start_id_base64 = yielding_start_id.toString('base64');
            const yielded_data = nsdt_embedded_protocol_decode(data.slice(4));

            yielding_handler_dict[yielding_start_id_base64](false, yielded_data, true);

            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_start_id_base64];

          } else if (protocol_code === this._ProtocolCodes.yielding_start_error[0]) {
            const yielding_start_id = data.slice(0, 4);
            const yielding_start_id_base64 = yielding_start_id.toString('base64');
            yielding_handler_dict[yielding_start_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_SERVICE('Yielding protocol error.'), null, true);

            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_start_id_base64];
          }
        });

        tunnel.on('error', (error) => {
          // [Flag]
          console.log(error);
          // service_of_activity.emitEventListener('externel-error');
        });

        tunnel.on('close', () => {
          service_of_activity.emitEventListener('passively-close');
          nsdt_embedded_protocol_destroy();
        });
      }
    });
  }
}

module.exports = ServiceOfActivityProtocol;

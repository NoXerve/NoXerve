/**
 * @file NoXerveAgent activity protocol activity_of_service_handler file. [activity_of_service_handler.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module ActivityOfServiceProtocol
 * @description Description.
 */

const Utils = require('../../../utils');
const Buf = require('../../../buffer');
const Errors = require('../../../errors');

/**
 * @constructor module:ActivityOfServiceProtocol
 * @param {object} settings
 * @description ActivityOfServiceProtocol module. SubModule of ActivityProtocol.
 */
function ActivityOfServiceProtocol(settings) {
  /**
   * @memberof module:ActivityOfServiceProtocol
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
 * @memberof module:ActivityOfServiceProtocol
 * @type {object}
 * @private
 */
ActivityOfServiceProtocol.prototype._ProtocolCodes = {
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

/**
 * @memberof module:ServiceOfActivityProtocol
 * @param {error} error - If service module create service_of_activity failed or not.
 * @param {object} service_of_activity
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
ActivityOfServiceProtocol.prototype.handleTunnel = function(error, activity_of_service, tunnel) {
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

        // For "service-function-call" event.
        let service_function_call_callback_dict = {};
        let yielding_start_callback_dict = {};
        let yielding_start_data_acknowledgment_callbacks = {};

        // Start communication with service.
        activity_of_service.on('service-function-call',
          (service_function_name, service_function_argument, service_function_call_callback) => {
            const service_function_call_callback_id = Utils.random4Bytes();

            // Register callback with callback id locally.
            service_function_call_callback_dict[service_function_call_callback_id.toString('base64')] = service_function_call_callback;

            // Activity Protocol type "service-function-call"
            tunnel.send(Buf.concat([
              this._ProtocolCodes.service_function_call,
              this._hash_manager.hashString4Bytes(service_function_name),
              service_function_call_callback_id,
              nsdt_embedded_protocol_encode(service_function_argument)
            ]));
          }
        );

        // Start communication with service.
        activity_of_service.on('yielding-start', (field_name, yielding_start_argument, yielding_start_callback) => {
          const yielding_start_id = Utils.random4Bytes();

          // Register callback with callback id locally.
          yielding_start_callback_dict[yielding_start_id.toString('base64')] = yielding_start_callback;

          // Activity Protocol type "yielding-start"
          tunnel.send(Buf.concat([
            this._ProtocolCodes.yielding_start,
            this._hash_manager.hashString4Bytes(field_name),
            yielding_start_id,
            nsdt_embedded_protocol_encode(yielding_start_argument)
          ]));
        });

        // Start communication with service.
        activity_of_service.on('initiative-close', (callback) => {
          tunnel.close(callback);
        });

        tunnel.on('data', (data) => {

          const protocol_code = data[0];
          data = data.slice(1);
          if(protocol_code === this._ProtocolCodes.nsdt_embedded[0]) {
            nsdt_emit_data(data);
          } else if (protocol_code === this._ProtocolCodes.service_function_call_data[0]) {
            const service_function_call_callback_id = data.slice(0, 4);
            const service_function_call_callback_id_base64 = service_function_call_callback_id.toString('base64');
            const acknowledgment_id = data.slice(4, 8);
            const service_function_yielded_data = nsdt_embedded_protocol_decode(data.slice(8));
            let acknowledge_function;

            // Generate acknowledge_function
            if(Buf.decodeUInt32BE(acknowledgment_id) !== 0) {
              acknowledge_function = (acknowledgment_information) => {
                // acknowledgment_information is nsdt supported.
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.service_function_call_data_acknowledge,
                  service_function_call_callback_id,
                  acknowledgment_id,
                  nsdt_embedded_protocol_encode(acknowledgment_information)
                ]));
              };
            }

            service_function_call_callback_dict[service_function_call_callback_id_base64](false, service_function_yielded_data, false, acknowledge_function);

            // Handle service function call error.
          } else if (protocol_code === this._ProtocolCodes.service_function_call_data_eof[0]) {
            const service_function_call_callback_id = data.slice(0, 4);
            const service_function_call_callback_id_base64 = service_function_call_callback_id.toString('base64');
            const service_function_yielded_data = nsdt_embedded_protocol_decode(data.slice(4));

            service_function_call_callback_dict[service_function_call_callback_id_base64](false, service_function_yielded_data, true);

            // EOF, delete the callback no longer useful.
            delete service_function_call_callback_dict[service_function_call_callback_id_base64];

          } else if (protocol_code === this._ProtocolCodes.service_function_call_error[0]) {
            const service_function_call_callback_id = data.slice(0, 4);
            const service_function_call_callback_id_base64 = service_function_call_callback_id.toString('base64');

            service_function_call_callback_dict[service_function_call_callback_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY('Service function call error.'), null, true);

            // EOF, delete the callback no longer useful.
            delete service_function_call_callback_dict[service_function_call_callback_id_base64];

            // Service Protocol type "yielding_start_acknowledge".
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

                // Service Protocol type "yielding_data_eof".
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

                // Service Protocol type "yielding_data".
                tunnel.send(Buf.concat([
                  this._ProtocolCodes.yielding_start_yield_data,
                  yielding_start_id,
                  Buf.encodeUInt32BE(acknowledgment_id),
                  nsdt_embedded_protocol_encode(data)
                ]));
              };

              yielding_start_callback_dict[yielding_start_id_base64] (
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

            yielding_start_callback_dict[yielding_start_id_base64](new Errors.ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY('Yielding request error.'));

            // EOF, delete the callback no longer useful.
            delete yielding_handler_dict[yielding_start_id_base64];
          }
        });

        tunnel.on('error', (error) => {
          // console.log(error);
          activity_of_service.emitEventListener('externel-error');
        });

        tunnel.on('close', () => {
          activity_of_service.emitEventListener('passively-close');
          nsdt_embedded_protocol_destroy();
        });
      }
    });
  }
}

module.exports = ActivityOfServiceProtocol;

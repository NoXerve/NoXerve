/**
 * @file NoXerveAgent service protocol service_of_activity_handler file. [service_of_activity_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceOfActivityProtocol
 * @description Service has properties to be take advantage of, by using prototype.
 * They can share hash results. etc.
 */

const Utils = require('../../../utils');
const Buf = require('../../../buffer');
const NSDT = require('../../../nsdt');

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
}

/**
 * @memberof module:ServiceOfActivityProtocol
 * @type {object}
 * @private
 */
ServiceOfActivityProtocol.prototype._protocol_codes = {
  service_function_call: Buf.from([0x01]),
  service_function_call_data: Buf.from([0x02]),
  service_function_call_data_eof: Buf.from([0x03]),
  service_function_call_error: Buf.from([0x04]),
  yielding_start: Buf.from([0x05]),
  yielding_start_acknowledge: Buf.from([0x06]),
  yielding_data: Buf.from([0x07]),
  yielding_data_eof: Buf.from([0x08]),
  yielding_error: Buf.from([0x09]),
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
    let yielding_handler_dict = {};
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
      // Service Protocol type "service-function-call" code 0x01
      // format:
      // +1 | +4 | +4 | ~
      // protocol_code, service_function_name, service_function_callback_id, NSDT_encoded
      if (protocol_code === this._protocol_codes.service_function_call[0]) {
        let service_function_callback_id;
        // Important value. Calculate first.
        try {
          service_function_callback_id = data.slice(4, 8);
        } catch (e) {}
        // Catch error.
        try {
          const service_function_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
          const service_function_parameter = NSDT.decode(data.slice(8));

          const return_function = (data) => {
            // Service Protocol type "service_function_call_data" code 0x02
            // format:
            // +1 | +4 | ~
            // service_function_call_data, service_function_callback_id, NSDT_encoded

            tunnel.send(Buf.concat([
              this._protocol_codes.service_function_call_data_eof,
              service_function_callback_id, NSDT.encode(data)
            ]));
          };

          const yield_function = (data) => {
            // Service Protocol type "service_function_call_data" code 0x03
            // format:
            // +1 | +4 | ~
            // service_function_call_data, service_function_callback_id, NSDT_encoded

            tunnel.send(Buf.concat([
              this._protocol_codes.service_function_call_data,
              service_function_callback_id, NSDT.encode(data)
            ]));
          };

          service_of_activity.emitEventListener('service-function-call',
            service_function_name,
            service_function_parameter,
            return_function,
            yield_function
          );
        } catch (error) {
          tunnel.send(Buf.concat([
            this._protocol_codes.service_function_call_error,
            service_function_callback_id
          ]));
        }
      } else if (protocol_code === this._protocol_codes.yielding_start[0]) {
        let yielding_id;
        // Important value. Calculate first.
        try {
          yielding_id = data.slice(4, 8);
        } catch (e) {}
        // Catch error.
        try {
          const yielding_id_base64 = yielding_id.toString('base64');
          const field_name = this._hash_manager.stringify4BytesHash(data.slice(0, 4));
          const yielding_handler_parameter = NSDT.decode(data.slice(8));

          service_of_activity.emitEventListener('yielding-start', field_name, yielding_handler_parameter, (yielding_handler_argument, yielding_handler) => {
            yielding_handler_dict[yielding_id_base64] = yielding_handler;
            // Service Protocol type "yielding_start_acknowledge"
            // format:
            // +1 | +4 | ~
            // service_function_call_data, service_function_callback_id, NSDT_encoded

            tunnel.send(Buf.concat([
              this._protocol_codes.yielding_start_acknowledge,
              yielding_id,
              NSDT.encode(yielding_handler_argument)
            ]));
          });
        } catch (error) {
          tunnel.send(Buf.concat([
            this._protocol_codes.yielding_error,
            yielding_id
          ]));
        }
      } else if (protocol_code === this._protocol_codes.yielding_data[0]) {
        const yielding_id = data.slice(0, 4);
        const yielded_data = NSDT.decode(data.slice(4));

        yielding_handler_dict[yielding_id.toString('base64')](false, yielded_data, false);
      } else if (protocol_code === this._protocol_codes.yielding_data_eof[0]) {
        const yielding_id = data.slice(0, 4);
        const yielding_id_base64 = data.slice(0, 4).toString('base64');
        const yielded_data = NSDT.decode(data.slice(4));

        yielding_handler_dict[yielding_id_base64](false, yielded_data, true);
        // EOF, delete the callback no longer useful.
        delete yielding_handler_dict[yielding_id_base64];
      } else if (protocol_code === this._protocol_codes.yielding_error[0]) {
        const yielding_id = data.slice(0, 4);
        const yielding_id_base64 = yielding_id.toString('base64');

        // [Flag] Uncatogorized error.
        yielding_handler_dict[yielding_id_base64](true, null, true);
        // EOF, delete the callback no longer useful.
        delete yielding_handler_dict[yielding_id_base64];
      }
    });

    tunnel.on('error', (error) => {
      service_of_activity.emitEventListener('externel-error');
    });

    tunnel.on('close', () => {
      service_of_activity.emitEventListener('passively-close');
    });
  }
}

module.exports = ServiceOfActivityProtocol;

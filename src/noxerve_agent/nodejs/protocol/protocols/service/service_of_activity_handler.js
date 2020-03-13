/**
 * @file NoXerveAgent service protocol service_of_activity_handler file. [service_of_activity_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceOfActivityHandler
 * @description Service has properties to be take advantage of, by using prototype.
 * They can share hash results. etc.
 */

 const Utils = require('../../../utils');
 const Buf = require('../../../buffer');
 const NSDT = require('../../../nsdt');
 const Crypto = require('crypto');

/**
 * @constructor module:ServiceOfActivityHandler
 * @param {object} settings
 * @description Service has properties to be take advantage of, by using prototype.
 * They can share hash results. etc.
 */
function ServiceOfActivityHandler(settings) {
  /**
   * @memberof module:ServiceOfActivityHandler
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ServiceOfActivityHandler
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:ServiceOfActivityHandler
   * @type {object}
   * @private
   */
  this._hash_to_string = {};

  /**
   * @memberof module:ServiceOfActivityHandler
   * @type {object}
   * @private
   */
  this._protocol_codes = {
    service_function_call: Buf.from([0x01]),
    service_function_call_data: Buf.from([0x02]),
    service_function_call_data_eof: Buf.from([0x03]),
    service_function_call_error: Buf.from([0x04])

  };
}

/**
 * @memberof module:ServiceOfActivityHandler
 * @param {string} string
 * @private
 * @description For service function call.
 */
ServiceOfActivityHandler.prototype._hash_string_4bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {
    const hash_sha256 = Crypto.createHash('md5');
    hash_sha256.update(string);
    result = hash_sha256.digest().slice(0, 4);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:ServiceOfActivityHandler
 * @param {buffer} _4bytes_hash
 * @private
 * @description For service function call.
 */
ServiceOfActivityHandler.prototype._stringify_4bytes_hash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

/**
 * @memberof module:ServiceOfActivityHandler
 * @param {error} error - If service module create service_of_activity failed or not.
 * @param {object} service_of_activity
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
ServiceOfActivityHandler.prototype.handle = function(error, service_of_activity, tunnel) {
  if (error) tunnel.close();
  else {
    // Hash service function name.
    service_of_activity.on('service-function-define', (service_function_name) => {
      this._hash_string_4bytes(service_function_name);
    });

    // Close communication with activity.
    service_of_activity.on('initiative-close', () => {
      tunnel.close();
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
        }
        catch(e) {}
        // Catch error.
        try {
          const service_function_name = this._stringify_4bytes_hash(data.slice(0, 4));
          const service_function_parameters = NSDT.decode(data.slice(8));

          service_of_activity.emitEventListener('service-function-call',
            service_function_name,
            service_function_parameters,

            // Return function.
            (data) => {
              // Service Protocol type "service_function_call_data" code 0x02
              // format:
              // +1 | +4 | ~
              // service_function_call_data, service_function_callback_id, NSDT_encoded

              tunnel.send(Buf.concat([
                this._protocol_codes.service_function_call_data_eof,
                service_function_callback_id
                , NSDT.encode(data)
              ]));
            },

            // Yield function.
            (data) => {
              // Service Protocol type "service_function_call_data" code 0x03
              // format:
              // +1 | +4 | ~
              // service_function_call_data, service_function_callback_id, NSDT_encoded

              tunnel.send(Buf.concat([
                this._protocol_codes.service_function_call_data,
                service_function_callback_id
                , NSDT.encode(data)
              ]));
            }
          );
        }
        catch(error) {
          tunnel.send(Buf.concat([
            this._protocol_codes.service_function_call_error,
            service_function_callback_id
          ]));
        }
      } else if (protocol_code === 0x01) {

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

module.exports = ServiceOfActivityHandler;

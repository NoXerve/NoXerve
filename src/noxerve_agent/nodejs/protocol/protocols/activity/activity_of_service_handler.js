/**
 * @file NoXerveAgent activity protocol activity_of_service_handler file. [activity_of_service_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ActivityOfServiceHandler
 * @description Description.
 */

const Utils = require('../../../utils');
const Buf = require('../../../buffer');
const NSDT = require('../../../nsdt');
const Crypto = require('crypto');

/**
 * @constructor module:ActivityOfServiceHandler
 * @param {object} settings
 * @description ActivityOfServiceHandler module. SubModule of ActivityProtocol.
 */
function ActivityOfServiceHandler(settings) {
  /**
   * @memberof module:ActivityOfServiceHandler
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ActivityOfServiceHandler
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:ActivityOfServiceHandler
   * @type {object}
   * @private
   */
  this._hash_to_string = {};

  /**
   * @memberof module:ActivityOfServiceHandler
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
 * @memberof module:ActivityOfServiceHandler
 * @param {string} string
 * @private
 * @description For service function call.
 */
ActivityOfServiceHandler.prototype._hash_string_4bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {
    const hash_sha256 = Crypto.createHash('sha256');
    hash_sha256.update(string);
    result = hash_sha256.digest().slice(0, 4);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:ActivityOfServiceHandler
 * @param {buffer} _4bytes_hash
 * @private
 * @description For service function call.
 */
ActivityOfServiceHandler.prototype._stringify_4bytes_hash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

/**
 * @memberof module:ServiceOfActivityHandler
 * @param {error} error - If service module create service_of_activity failed or not.
 * @param {object} service_of_activity
 * @param {tunnel} tunnel
 * @description Method that handle service of activity protocol from service protocol module.
 */
ActivityOfServiceHandler.prototype.handle = function(error, activity_of_service, tunnel) {
  if (error) tunnel.close();
  else {
    // For "service-function-call" event.
    let service_function_callback_dict = {};

    // Start communication with service.
    activity_of_service.on('service-function-call',
      (service_function_name, service_function_arguments, service_function_callback) => {
        const service_function_callback_id = Utils.random4bytes();
        console.log(service_function_callback_id);

        // Register callback with callback id locally.
        service_function_callback_dict[service_function_callback_id.toString('base64')] = service_function_callback;

        // Activity Protocol type "service-function-call" code 0x01
        // format:
        // +1 | +4 | +4 | ~
        // protocol_code, service_function_name, service_function_callback_id, NSDT_encoded
        tunnel.send(Buf.concat([
          this._protocol_codes.service_function_call,
          this._hash_string_4bytes(service_function_name),
          service_function_callback_id,
          NSDT.encode(service_function_arguments)
        ]));
      });

    tunnel.on('data', (data) => {
      // code | type
      // 0x01 service-function-call

      const protocol_code = data[0];
      data = data.slice(1);

      if (protocol_code === this._protocol_codes.service_function_call_data_eof[0]) {
        const service_function_callback_id = data.slice(0, 4);
        const service_function_yielded_data = NSDT.decode(data.slice(4));
        const service_function_callback_id_base64 = service_function_callback_id.toString('base64');

        service_function_callback_dict[service_function_callback_id_base64](false, service_function_yielded_data, true);

        // EOF, delete the callback no longer useful.
        delete service_function_callback_dict[service_function_callback_id_base64];

      } else if (protocol_code === this._protocol_codes.service_function_call_data[0]) {
        const service_function_callback_id = data.slice(0, 4);
        const service_function_yielded_data = NSDT.decode(data.slice(4));
        console.log(service_function_callback_id);
        service_function_callback_dict[service_function_callback_id.toString('base64')](false, service_function_yielded_data, false);
      }
    });

    tunnel.on('error', (error) => {
      activity_of_service.emitEventListener();
    });

    tunnel.on('close', () => {
      activity_of_service.emitEventListener();
    });
  }
}

module.exports = ActivityOfServiceHandler;

/**
 * @file NoXerveAgent service protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module ServiceProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const service_of_activity_handler = require('./service_of_activity_handler');


/**
 * @constructor module:ServiceProtocol
 * @param {object} settings
 * @description NoXerve Agent ServiceProtocol Object. Protocols of service module.
 */

function ServiceProtocol(settings) {
  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   */
  this._service_module = settings.related_module;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   * @description Open a handshake. Actually useless for ServiceProtocol module.
   */
  this._open_handshake_function = settings.open_handshake;

  /**
   * @memberof module:ServiceProtocol
   * @type {object}
   * @private
   * @description ActivityId to tunnel dictionary.
   */
  this._activity_id_to_tunnel_dict = {};
}

ServiceProtocol.prototype.start = function() {

}

// [Flag] Unfinished annotation.
ServiceProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge) {
  // Synchronize information for handshake
  // Format:
  // service-activity byte
  // 0x01

  if(synchronize_information.length === 1 && synchronize_information[0] === 1) {
    const generated_activity_id = Utils.random8bytes();
    const generated_activity_id_base64 = generated_activity_id.toString('base64');
    this._activity_id_to_tunnel_dict[generated_activity_id_base64] = null;

    onError((error)=> {
      return false;
    });

    onAcknowledge((acknowledge_information, tunnel)=> {
      if(acknowledge_information[0] === 0x01) {
        this._service_module.emit('activity-connect', (error, service_of_activity)=> {
          service_of_activity_handler(error, service_of_activity, tunnel);
        });
      }
      else {
        return false;
      }
    });

    // Send 8 bytes id;
    return generated_activity_id;
  }
  else return false;
}

module.exports = {
  protocol_name: 'service',
  related_module_name: 'service',
  module: ServiceProtocol
};

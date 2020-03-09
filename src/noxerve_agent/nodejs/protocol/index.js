/**
 * @file NoXerveAgent protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Protocol
 */

const Errors = require('../errors');

// Initial supported protocols detail.
const SupportedProtocolsPath = require("path").join(__dirname, "./protocols");
let SupportedProtocols = {};

// Load avaliable protocols auto-dynamicly.
require("fs").readdirSync(SupportedProtocolsPath).forEach((file_name) => {
  let protocol = require(SupportedProtocolsPath + "/" + file_name);

  // Mapping protocol's name from specified module.
  SupportedProtocols[protocol.protocol_name] = protocol;
});

/**
 * @constructor module:Protocol
 * @param {object} settings
 * @description NoXerve Protocol Object. Protocols module focus only on format.
 * Please do not put too much logic in protocols..
 */

function Protocol(settings) {
  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._imported_modules = settings.modules;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._node_module = settings.node_module;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._protocol_modules = {};

  // Initailize this._protocols.
  for(const protocol_name in SupportedProtocols) {
    // Fetch protocol.
    let Protocol = SupportedProtocols[protocol_name];

    // Check it's related module exists.
    if(!this._imported_modules[Protocol.related_module_name]) {

      // Check it's related module exists.
      this._protocol_modules[Protocol.protocol_name] = new Protocol.module({
        related_module: this._imported_modules[Protocol.related_module_name],
        open_handshake: this._openHandshake
      });
    }
  }
}

/**
 * Handshake routine:
 * open_handshake(initiative)
 * => synchronize(passive)
 * => acknowledge_synchronization(initiative finished)
 * => acknowledge(passive finished)
 */

// [Flag] Unfinished annotation.
Protocol.prototype._openHandshake = function(interface_name, interface_connect_settings, callback) {
  this._node_module.createTunnel(interface_name, interface_connect_settings, ()=> {

  });
}

// [Flag] Unfinished annotation.
Protocol.prototype.start = function() {
  // Handle tunnel create event from node module.
  // Specificlly speaking, use handshake to identify which module does tunnel belong to.
  this._node_module.on('tunnel-create', (tunnel) => {
    // Check is passive. Since following patterns are designed only for the role of passive.
    if (tunnel.returnValue('from_connector')) {
      tunnel.close()
    } else {

      // Use stage variable to identify current handshake progress.
      // Avoiding proccess executed wrongly.
      // stage 0 => waiting to synchronize.
      // stage 1 => waiting to acknowledge.
      let stage = 0;

      let ready_state = false;
      let related_module = null;

      // Needed fo stage 1. "onSynchronizationError"'s argument from protocol module.
      let synchronize_information_for_synchronization_error = null;

      tunnel.on('ready', () => {
        let ready_state = true;
      });
      tunnel.on('data', (data) => {
        if (stage === 0) {
          // Check if any protocol module synchronize with the data or not.
          for(const protocol_name in this._protocol_modules) {
            // Call synchronize function. Check will it respond with data or not.
            let synchronize_returned_data = this._protocol_modules[protocol_name].synchronize(data);

            // If responded then finish up.
            if(synchronize_returned_data !== false && synchronize_returned_data !== null) {

              // Associate protocol module and send data to remote.
              related_module = this._protocol_modules[protocol_name];

              // stage 1 => waiting to acknowledge. If any error happened call
              // "onSynchronizationError" from protocol module.
              synchronize_information_for_synchronization_error = data;

              stage = 1;

              // Send synchronize() return value to remote.
              try {
                tunnel.send(synchronize_returned_data);
              }
              catch(error) {
                related_module.onSynchronizationError(error, data);
              }
            }
          }

          // If no protocol module synchronize with the data. Close tunnel.
          if(related_module === null) {
            tunnel.close()
          }
        } else if (stage === 1) {
          // Reset events.
          tunnel.on('ready',  ()=> {});
          tunnel.on('data',  ()=> {});
          tunnel.on('error',  ()=> {});

          // Finished handshake. Transfer tunnel ownership.
          related_module.acknowledge(data, tunnel);
        }
      });

      tunnel.on('error', (error) => {
        if (ready_state) {
          if(stage === 0) {
            // Happened error even not synchronize at all. Abort opreation without any further actions.
            tunnel.close();
          }
          else if(stage === 1) {
            related_module.onSynchronizationError(error, synchronize_information_for_synchronization_error);
          }
        } else {
          // Happened error even not ready at all. Abort opreation without any further actions.
          tunnel.close();
        }
      });
    }
  });
}

// [Flag] Unfinished annotation.
Protocol.prototype.close = function() {

}

module.exports = Protocol;

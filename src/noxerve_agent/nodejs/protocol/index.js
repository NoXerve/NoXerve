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
  AvaliableInterfaces[protocol.protocol_name] = protocol;
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

}

/**
 * Handshake routine:
 * open_handshake(initiative)
 * => synchronize(passive)
 * => acknowledge_synchronization(initiative finished)
 * => acknowledge(passive finished)
 */

// [Flag] Unfinished annotation.
Protocol.prototype._openHandshake = function() {

}

// [Flag] Unfinished annotation.
Protocol.prototype.start = function() {
  // Handle tunnel create event from node module.
  // Specificlly speaking, use handshake to identify which module does tunnel belong to.
  this._node_module.on('tunnel-create', (tunnel) => {
    // Check is passive. Since following patterns are designed only for the role of passive.
    if(tunnel.returnValue('from_connector')) {
      tunnel.close()
    }
    else {
      // Use stage variable to identify current handshake progress.
      // Avoiding proccess executed wrongly.
      // stage 0 => waiting to synchronize
      // stage 1 => waiting to acknowledge

      let stage = 0;

      let ready_state = false;
      tunnel.on('ready', () => {
        let ready_state = true;
      });
      tunnel.on('data', () => {

      });
      tunnel.on('error', () => {
        if(ready_state) {

        }
        else {
          // Happened error even not ready all. Abort opreation without any further actions.
          tunnel.close();
        }
      });
    }
  });

}

// [Flag] Unfinished annotation.
Protocol.prototype.close = function() {

}

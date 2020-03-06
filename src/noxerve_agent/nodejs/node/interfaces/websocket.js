/**
 * @file NoXerveAgent interface file. [websocket.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

/**
 * @module WebsocketInterface
 */

const WebSocket = require('ws');

/**
 * @constructor
 * @param {object} settings
 * @description Passive interface of WebSocket
 */
function Passive(settings) {
  /**
   * @memberof Passive
   * @type {object}
   * @private
   */
  this._settings = settings;
}

Passive.prototype.destroy = function(callback) {
  callback();
}

/**
 * @constructor
 * @param {object} settings
 * @description Initiative interface of WebSocket
 */
function Initiative(settings) {
  /**
   * @memberof Passive
   * @type {object}
   * @private
   */
  this._settings = settings;
}


module.exports = {
  /**
   * @memberof module:WebsocketInterface
   * @type {Passive}
   */
  Passive: Passive,

  /**
   * @memberof module:WebsocketInterface
   * @type {Initiative}
   */
  Initiative: Initiative,

  /**
   * @memberof module:WebsocketInterface
   * @type {string}
   */
  interface_name: 'websocket',

  /**
   * @memberof module:WebsocketInterface
   * @type {array}
   */
  interface_name_aliases: [
    'ws',
    'WebSocket'
  ]
}

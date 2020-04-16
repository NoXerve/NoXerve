/**
 * @file NoXerveAgent Scope file. [scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Scope
 */

const Errors = require('../../../../errors');

/**
 * @constructor module:Scope
 * @param {object} settings
 * @description Scope Object.
 */

function Scope(settings) {
  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
  this._stateful = settings.stateful;

  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'passively-close': ()=> {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if(close_handler) close_handler();
    }
  };
}

Scope.prototype.start = function(callback) {

}

/**
 * @memberof module:Scope
 * @param {string} event_name
 * @description Scope events emitter. For internal uses.
 */
Scope.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = Scope;

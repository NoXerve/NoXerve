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
  this._node_modules = settings.node_module;
}

// [Flag] Unfinished annotation.
Protocol.prototype.start = function() {
  
}

// [Flag] Unfinished annotation.
Protocol.prototype.close = function() {

}

/**
 * @file NoXerveAgent activity NoXerve Supported Data Type index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */


'use strict';

/**
 * @module NSDT
 */

// NSTD cheatsheet
// Code | Type
// 0 blob
// 1 json
// 2 noxerve callback dictionary

/**
 * @constructor module:NSDT
 * @param {object} settings
 * @description NoXerve Supported Data Type module. Encode, Decode from and to
 * blob and supported data type.
 */
function NSDT(settings) {
  /**
   * @memberof module:NSDT
   * @type {object}
   * @private
   */
  this._settings = settings;
}

module.exports = NSDT;

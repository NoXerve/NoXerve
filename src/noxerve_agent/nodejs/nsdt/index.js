/**
 * @file NoXerveAgent activity NoXerve Supported Data Type index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */


 'use strict';

 /**
  * @module NSDT
  */

  const Buf = require('../../../buffer');

// NSTD cheatsheet
// Code | Type
// 0 blob
// 1 string
// 2 json

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

// [Flag] Unfinished annotation.
// NSDT => blob
NSDT.prototype.encode = function(noxerve_supported_data_type_object) {

}

// [Flag] Unfinished annotation.
// blob => NSDT
NSDT.prototype.decode = function(noxerve_supported_data_type_object) {

}

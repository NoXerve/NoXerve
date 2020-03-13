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

const Buf = require('../buffer');

// 4.2 Gbytes
const MaxBytesLength = Math.pow(2, 32);

// NSTD cheatsheet
// Code | Type
// 0 blob
// 1 json
// 2 noxerve callback dictionary

// /**
//  * @constructor module:NSDT
//  * @param {object} settings
//  * @description NoXerve Supported Data Type module. Encode, Decode from and to
//  * blob and supported data type.
//  */
// function NSDT(settings) {
//   /**
//    * @memberof module:NSDT
//    * @type {object}
//    * @private
//    */
//   this._settings = settings;
// }

// [Flag] Unfinished annotation.
// NSDT => blob
module.exports.encode = function(noxerve_supported_data_type_object) {
  let blob;
  let type;
  // Patch undefined.
  if(typeof(noxerve_supported_data_type_object) === 'undefined') {
    noxerve_supported_data_type_object = null;
  }
  if (Buf.isBuffer(noxerve_supported_data_type_object)) {
    type = 0x00;
    blob = noxerve_supported_data_type_object;

  } else {
    type = 0x01;
    blob = Buf.encode(JSON.stringify(noxerve_supported_data_type_object));
  }

  if (blob.length < MaxBytesLength) {
    return Buf.concat([Buf.from([type]), blob]);
  } else {
    // [Flag] Uncatogorized error.
    throw true;
  }
}

// [Flag] Unfinished annotation.
// blob => NSDT
module.exports.decode = function(noxerve_supported_data_type_blob) {
  let type = noxerve_supported_data_type_blob[0];

  if (type === 0x00) {
    return noxerve_supported_data_type_blob.slice(1);

  } else if (type === 0x01) {
    return JSON.parse(Buf.decode(noxerve_supported_data_type_blob.slice(1)));
  }
}

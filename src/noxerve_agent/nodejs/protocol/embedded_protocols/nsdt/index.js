/**
 * @file NoXerveAgent nsdt embedded protocol index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module NSDTEmbeddedProtocol
 */

// 4.2 Gbytes
const MaxBytesLength = Math.pow(2, 32);
const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');

/**
 * @constructor module:NSDTEmbeddedProtocol
 * @param {object} settings
 * @description NoXerve Agent NSDTEmbeddedProtocol Object. Protocols of activity module.
 */

function NSDTEmbeddedProtocol(settings) {
  /**
   * @memberof module:NSDTEmbeddedProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:NSDTEmbeddedProtocol
   * @type {object}
   * @private
   */
  this._nsdt_module = settings.related_module;
}

/**
 * @memberof module:NSDTEmbeddedProtocol
 * @type {object}
 * @private
 */
NSDTEmbeddedProtocol.prototype._ProtocolCodes = {
  service_and_activity: Buf.from([0x01])
}

/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {object} noxerve_supported_data_type_object
 * @return {buffer} noxerve_supported_data_type_blob
 * @description NSDT => blob
 */
NSDTEmbeddedProtocol.prototype.encode = function(noxerve_supported_data_type_object) {
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

/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {buffer} noxerve_supported_data_type_blob
 * @return {object} noxerve_supported_data_type_object
 * @description blob => NSDT
 */
NSDTEmbeddedProtocol.prototype.decode = function(noxerve_supported_data_type_blob) {
  let type = noxerve_supported_data_type_blob[0];

  if (type === 0x00) {
    return noxerve_supported_data_type_blob.slice(1);

  } else if (type === 0x01) {
    return JSON.parse(Buf.decode(noxerve_supported_data_type_blob.slice(1)));
  }
}

/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {buffer} noxerve_supported_data_type_blob
 * @return {object} noxerve_supported_data_type_object
 * @description blob => NSDT
 */
NSDTEmbeddedProtocol.prototype.createRuntimeProtocol = function(callback) {
  const encode = (noxerve_supported_data_type_object) => {
    return this.encode(noxerve_supported_data_type_object);
  };

  const decode = (noxerve_supported_data_type_blob) => {
    return this.decode(noxerve_supported_data_type_blob);
  };

  const destroy = () => {

  };

  callback(false, encode, decode, destroy);
}

module.exports = {
  protocol_name: 'nsdt_embedded',
  related_module_name: 'nsdt',
  module: NSDTEmbeddedProtocol
};

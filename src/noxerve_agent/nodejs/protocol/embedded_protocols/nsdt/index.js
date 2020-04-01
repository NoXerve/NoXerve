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

  /**
   * @memberof module:NSDTEmbeddedProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;
}

/**
 * @callback module:NSDTEmbeddedProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {module:NSDTEmbeddedProtocol~callback_of_start} callback
 * @description Start running NSDTEmbeddedProtocol.
 */
NSDTEmbeddedProtocol.prototype.start = function(callback) {
  // this._nsdt_module.on('callbale-structure-create', () => {
  //
  // });
  if (callback) callback(false);
}

/**
 * @callback module:NSDTEmbeddedProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {module:NSDTEmbeddedProtocol~callback_of_close} callback
 * @description Close the module.
 */
NSDTEmbeddedProtocol.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @memberof module:NSDTEmbeddedProtocol
 * @type {object}
 * @private
 */
NSDTEmbeddedProtocol.prototype._ProtocolCodes = {
  binary: Buf.from([0x00]),
  json: Buf.from([0x01]),
  callable_struture_define: Buf.from([0x02]),
  callable_struture_call: Buf.from([0x03]),
  callable_struture_call_return: Buf.from([0x04])
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
    type = this._ProtocolCodes.binary;
    blob = noxerve_supported_data_type_object;

  } else {
    type = this._ProtocolCodes.json;
    blob = Buf.encode(JSON.stringify(noxerve_supported_data_type_object));
  }

  if (blob.length < MaxBytesLength) {
    return Buf.concat([type, blob]);
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
  let on_data_listener = () => {};

  let callable_strutures = {};
  let volatilizing_callbacks = {};

  const encode = (noxerve_supported_data_type_object) => {
    if(noxerve_supported_data_type_object.isCallableStructure){
      const callable_struture_id = Utils.random8Bytes();
      const callable_struture_id_base64 = callable_struture_id.toString('base64');

      // Register callable_struture.
      callable_strutures[callable_struture_id_base64] = noxerve_supported_data_type_object;
      noxerve_supported_data_type_object.on('initiative-close', () => {

        callable_strutures.emitEventListener('', () => {

        });
        // Deregister callable_struture. In order to make gc works.
        delete callable_strutures[callable_struture_id_base64];
      });

      // Encode function names.
      const function_names = noxerve_supported_data_type_object.returnFunctionNameList();
      const function_name_bytes_list = [];
      for(const index in function_names) {
        function_name_bytes_list.push(this._hash_manager.hashString4Bytes(function_names[index]));
      }

      return Buf.concat([
        this._ProtocolCodes.callable_struture_define,
        callable_struture_id,
        Buf.concat(function_name_bytes_list)
      ]);
    }
    else {
      return this.encode(noxerve_supported_data_type_object);
    }
  };

  const decode = (noxerve_supported_data_type_blob) => {
    const protocol_code = noxerve_supported_data_type_blob[0];
    if(protocol_code === this._ProtocolCodes.callable_struture_define[0]) {
      const callable_struture_id = noxerve_supported_data_type_blob.slice(1, 5);
      let function_name_bytes_list = [];
      for(let enumerated_bytes_count = 5; enumerated_bytes_count < noxerve_supported_data_type_blob.length; enumerated_bytes_count += 4) {
        function_name_bytes_list.push(noxerve_supported_data_type_blob.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
      }

      this._nsdt_module.emitEventListener('callable-structure-remote-request', (error, callable_struture_remote) => {
        callable_struture_remote.on('call', () => {
          
        });
      });

      console.log(function_name_bytes_list);
    }
    else return this.decode(noxerve_supported_data_type_blob);
  }

  const on_data = (callback) => {
    on_data_listener = callback;
  };

  const emit_data = (data) => {
    const protocol_code = data[0];
    if(protocol_code === this._ProtocolCodes.callable_struture_call[0]) {

    }
  };

  const destroy = () => {

  };

  callback(false, encode, decode, on_data, emit_data, destroy);
}

module.exports = {
  protocol_name: 'nsdt_embedded',
  related_module_name: 'nsdt',
  module: NSDTEmbeddedProtocol
};

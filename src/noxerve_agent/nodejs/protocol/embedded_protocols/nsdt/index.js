/**
 * @file NoXerveAgent nsdt embedded protocol index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
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
  volatilizing_callback: Buf.from([0x02]),
  volatilizing_callback_call: Buf.from([0x03]),
  callable_struture_define: Buf.from([0x04]),
  callable_struture_close: Buf.from([0x05]),
  callable_struture_call: Buf.from([0x06]),
  callable_struture_call_return: Buf.from([0x07])
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
  if (typeof(noxerve_supported_data_type_object) === 'undefined') {
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
    throw new Errors.ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED('NSDTEmbeddedProtocol encode error. Exceeded MaxBytesLength.');
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

  if (type === this._ProtocolCodes.binary[0]) {
    return noxerve_supported_data_type_blob.slice(1);

  } else if (type === this._ProtocolCodes.json[0]) {
    return JSON.parse(Buf.decode(noxerve_supported_data_type_blob.slice(1)));
  }
}

/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {buffer} noxerve_supported_data_type_blob
 * @return {object} noxerve_supported_data_type_object
 * @description Create bidirectional runtime protocol for a particular protocol connection.
 */
NSDTEmbeddedProtocol.prototype.createBidirectionalRuntimeProtocol = function(callback) {
  let on_data_from_nsdt_embedded_protocol_listener = () => {};

  // Register.
  let callable_strutures_dict = {};
  let volatilizing_callbacks_dict = {};
  let remote_callable_strutures_dict = {};

  const encode_runtime = (noxerve_supported_data_type_object) => {

    // volatilizing_callbacks_dict(be disappeared after call).
    if (typeof(noxerve_supported_data_type_object) === 'function') {
      const volatilizing_callback_id_8bytes = Utils.random8Bytes();
      volatilizing_callbacks_dict[volatilizing_callback_id_8bytes.toString('base64')] = noxerve_supported_data_type_object;
      return Buf.concat([
        this._ProtocolCodes.volatilizing_callback,
        volatilizing_callback_id_8bytes
      ]);
    } else if (noxerve_supported_data_type_object && noxerve_supported_data_type_object.isLocalCallableStructure) {
      const callable_struture_id_8bytes = noxerve_supported_data_type_object.Id;
      const callable_struture_id_8bytes_base64 = callable_struture_id_8bytes.toString('base64');

      // Register callable_struture.
      callable_strutures_dict[callable_struture_id_8bytes_base64] = noxerve_supported_data_type_object;
      noxerve_supported_data_type_object.on('initiative-close', () => {
        noxerve_supported_data_type_object.emitEventListener('passively-close');
        on_data_from_nsdt_embedded_protocol_listener(Buf.concat([
          this._ProtocolCodes.callable_struture_close,
          callable_struture_id_8bytes
        ]));
        // Deregister callable_struture. In order to make gc works.
        delete callable_strutures_dict[callable_struture_id_8bytes_base64];
      });

      // Encode function names.
      const function_names = noxerve_supported_data_type_object.returnFunctionNameList();
      const concat_bytes_list = [
        this._ProtocolCodes.callable_struture_define,
        callable_struture_id_8bytes
      ];
      for (const index in function_names) {
        concat_bytes_list.push(this._hash_manager.hashString4Bytes(function_names[index]));
      }

      return Buf.concat(concat_bytes_list);
    }
    else if(noxerve_supported_data_type_object && noxerve_supported_data_type_object.isRemoteCallableStructure) {
      throw new Errors.ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED('Encode error. Should not encode remote callable structure.');
    }
    else {
      return this.encode(noxerve_supported_data_type_object);
    }
  };

  const decode_runtime = (noxerve_supported_data_type_blob) => {
    const protocol_code = noxerve_supported_data_type_blob[0];

    if (protocol_code === this._ProtocolCodes.volatilizing_callback[0]) {
      const volatilizing_callback_id_8bytes = noxerve_supported_data_type_blob.slice(1, 9);
      const call_volatilizing_callback = (...params) => {
        const concat_bytes_list = [
          this._ProtocolCodes.volatilizing_callback_call,
          volatilizing_callback_id_8bytes
        ];

        // Encoding parameters for remote.
        for (const index in params) {
          const arg = params[index];
          const runtime_encoded = encode_runtime(arg);
          concat_bytes_list.push(Buf.encodeUInt32BE(runtime_encoded.length));
          concat_bytes_list.push(runtime_encoded);
        }

        on_data_from_nsdt_embedded_protocol_listener(Buf.concat(concat_bytes_list));
      };
      return call_volatilizing_callback;
    } else if (protocol_code === this._ProtocolCodes.callable_struture_define[0]) {
      const callable_struture_id_8bytes = noxerve_supported_data_type_blob.slice(1, 9);
      // Prevent repeated RCS overwrite.
      if(remote_callable_strutures_dict[callable_struture_id_8bytes.toString('base64')]) return;
      let function_name_bytes_list = [];
      for (let enumerated_bytes_count = 9; enumerated_bytes_count < noxerve_supported_data_type_blob.length; enumerated_bytes_count += 4) {
        function_name_bytes_list.push(noxerve_supported_data_type_blob.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
      }

      const callable_struture_remote = this._nsdt_module.emitEventListener('callable-structure-remote-request');

      callable_struture_remote.on('call', (function_name, args) => {
        const function_name_4bytes = this._hash_manager.hashString4Bytes(function_name);
        let function_name_include = false;

        // Check is function_name exists.
        for (const index in function_name_bytes_list) {
          if (Utils.areBuffersEqual(function_name_bytes_list[index], function_name_4bytes)) {
            function_name_include = true;
            break;
          }
        }

        if (!function_name_include) {
          throw new Errors.ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED('Such function (' + function_name + ') does not exist in this callable structure.');
        }

        const concat_bytes_list = [
          this._ProtocolCodes.callable_struture_call,
          callable_struture_id_8bytes,
          function_name_4bytes
        ];

        // Encoding parameters for remote.
        for (const index in args) {
          const arg = args[index];
          const runtime_encoded = encode_runtime(arg);
          concat_bytes_list.push(Buf.encodeUInt32BE(runtime_encoded.length));
          concat_bytes_list.push(runtime_encoded);
        }

        on_data_from_nsdt_embedded_protocol_listener(Buf.concat(concat_bytes_list));
      });

      remote_callable_strutures_dict[callable_struture_id_8bytes.toString('base64')] = callable_struture_remote;

      return callable_struture_remote;
    } else return this.decode(noxerve_supported_data_type_blob);
  }

  const on_data_from_nsdt_embedded_protocol = (listener) => {
    on_data_from_nsdt_embedded_protocol_listener = listener;
  };

  const emit_data_to_nsdt_embedded_protocol = (data) => {
    const protocol_code = data[0];
    if (protocol_code === this._ProtocolCodes.callable_struture_call[0]) {
      const callable_struture_id_8bytes = data.slice(1, 9);
      const function_name = this._hash_manager.stringify4BytesHash(data.slice(9, 13));
      let args = [];

      for (let enumerated_bytes_count = 13; enumerated_bytes_count < data.length;) {
        const arg_length = Buf.decodeUInt32BE(data.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
        const arg_bytes = data.slice(enumerated_bytes_count + 4, enumerated_bytes_count + 4 + arg_length);
        enumerated_bytes_count = enumerated_bytes_count + 4 + arg_length;
        args.push(decode_runtime(arg_bytes));
      }

      // Call callable_struture.
      callable_strutures_dict[callable_struture_id_8bytes.toString('base64')].emitEventListener('call-request', function_name, args);
    } else if (protocol_code === this._ProtocolCodes.volatilizing_callback_call[0]) {
      const volatilizing_callback_id_8bytes = data.slice(1, 9);
      const volatilizing_callback_id_base64 = volatilizing_callback_id_8bytes.toString('base64');
      let args = [];

      for (let enumerated_bytes_count = 9; enumerated_bytes_count < data.length;) {
        const arg_length = Buf.decodeUInt32BE(data.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
        const arg_bytes = data.slice(enumerated_bytes_count + 4, enumerated_bytes_count + 4 + arg_length);
        enumerated_bytes_count = enumerated_bytes_count + 4 + arg_length;
        args.push(decode_runtime(arg_bytes));
      }

      // Call volatilizing_callbacks_dict.
      volatilizing_callbacks_dict[volatilizing_callback_id_base64].apply(null, args);
      delete volatilizing_callbacks_dict[volatilizing_callback_id_base64];
    } else if (protocol_code === this._ProtocolCodes.callable_struture_close[0]) {
      const callable_struture_id_8bytes = data.slice(1, 9);
      const callable_struture_id_8bytes_base64 = callable_struture_id_8bytes.toString('base64');
      remote_callable_strutures_dict[callable_struture_id_8bytes_base64].emitEventListener('close');
      delete remote_callable_strutures_dict[callable_struture_id_8bytes_base64];
    }
  };

  const destroy = () => {
    for (const index in callable_strutures_dict) {
      callable_strutures_dict[index].emitEventListener('passively-close');
      delete callable_strutures_dict[index];
    }
    for (const index in volatilizing_callbacks_dict) {
      delete volatilizing_callbacks_dict[index];
    }
    for (const index in remote_callable_strutures_dict) {
      remote_callable_strutures_dict[index].emitEventListener('close');
      delete remote_callable_strutures_dict[index];
    }
  };

  callback(false, encode_runtime, decode_runtime, on_data_from_nsdt_embedded_protocol, emit_data_to_nsdt_embedded_protocol, destroy);
}


/**
 * @memberof module:NSDTEmbeddedProtocol
 * @param {buffer} noxerve_supported_data_type_blob
 * @return {object} noxerve_supported_data_type_object
 * @description Create multidirectional runtime protocol for a particular protocol connection.
 */
NSDTEmbeddedProtocol.prototype.createMultidirectionalProtocol = function(max_peer_identifier_int, my_peer_identifier, callback) {
  let on_data_from_nsdt_embedded_protocol_listener = (peer_identifier, data) => {};

  // Register.
  let callable_strutures_dict = {};
  let volatilizing_callbacks_dict = {};

  let remote_callable_strutures_list = [];

  // let bidirectional_runtime_protocol_of_each_connection_list = [];

  const encode_runtime = (noxerve_supported_data_type_object) => {
      // volatilizing_callbacks_dict(be disappeared after call).
      if (typeof(noxerve_supported_data_type_object) === 'function') {
        const volatilizing_callback_id_8bytes = Utils.random8Bytes();
        volatilizing_callbacks_dict[volatilizing_callback_id_8bytes.toString('base64')] = noxerve_supported_data_type_object;
        return Buf.concat([
          this._ProtocolCodes.volatilizing_callback,
          volatilizing_callback_id_8bytes
        ]);
      } else if (noxerve_supported_data_type_object && noxerve_supported_data_type_object.isLocalCallableStructure) {
        const callable_struture_id_8bytes = noxerve_supported_data_type_object.Id;
        const callable_struture_id_8bytes_base64 = callable_struture_id_8bytes.toString('base64');

        // Register callable_struture.
        callable_strutures_dict[callable_struture_id_8bytes_base64] = noxerve_supported_data_type_object;
        noxerve_supported_data_type_object.on('initiative-close', () => {
          noxerve_supported_data_type_object.emitEventListener('passively-close');
          for(let i = 0; i < max_peer_identifier_int; i++) {
            on_data_from_nsdt_embedded_protocol_listener(i+1, Buf.concat([
              this._ProtocolCodes.callable_struture_close,
              callable_struture_id_8bytes
            ]));
          }
          // Deregister callable_struture. In order to make gc works.
          delete callable_strutures_dict[callable_struture_id_8bytes_base64];
        });

        // Encode function names.
        const function_names = noxerve_supported_data_type_object.returnFunctionNameList();
        const concat_bytes_list = [
          this._ProtocolCodes.callable_struture_define,
          callable_struture_id_8bytes
        ];
        for (const index in function_names) {
          concat_bytes_list.push(this._hash_manager.hashString4Bytes(function_names[index]));
        }

        return Buf.concat(concat_bytes_list);
      }
      else if(noxerve_supported_data_type_object && noxerve_supported_data_type_object.isRemoteCallableStructure) {
        throw new Errors.ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED('Encode error. Should not encode remote callable structure.');
      }
      else {
        return this.encode(noxerve_supported_data_type_object);
      }
  };

  const decode_runtime = (peer_identifier_int, noxerve_supported_data_type_blob) => {
    const protocol_code = noxerve_supported_data_type_blob[0];

    if (protocol_code === this._ProtocolCodes.volatilizing_callback[0]) {
      const volatilizing_callback_id_8bytes = noxerve_supported_data_type_blob.slice(1, 9);
      const call_volatilizing_callback = (...params) => {
        const concat_bytes_list = [
          this._ProtocolCodes.volatilizing_callback_call,
          volatilizing_callback_id_8bytes
        ];

        // Encoding parameters for remote.
        for (const index in params) {
          const arg = params[index];
          const runtime_encoded = encode_runtime(arg);
          concat_bytes_list.push(Buf.encodeUInt32BE(runtime_encoded.length));
          concat_bytes_list.push(runtime_encoded);
        }

        on_data_from_nsdt_embedded_protocol_listener(peer_identifier_int, Buf.concat(concat_bytes_list));
      };
      return call_volatilizing_callback;
    } else if (protocol_code === this._ProtocolCodes.callable_struture_define[0]) {
      const callable_struture_id_8bytes = noxerve_supported_data_type_blob.slice(1, 9);
      // Prevent repeated RCS overwrite.
      if(remote_callable_strutures_list[peer_identifier_int-1][callable_struture_id_8bytes.toString('base64')]) return;
      let function_name_bytes_list = [];
      for (let enumerated_bytes_count = 9; enumerated_bytes_count < noxerve_supported_data_type_blob.length; enumerated_bytes_count += 4) {
        function_name_bytes_list.push(noxerve_supported_data_type_blob.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
      }

      const callable_struture_remote = this._nsdt_module.emitEventListener('callable-structure-remote-request');

      callable_struture_remote.on('call', (function_name, args) => {
        const function_name_4bytes = this._hash_manager.hashString4Bytes(function_name);
        let function_name_include = false;

        // Check is function_name exists.
        for (const index in function_name_bytes_list) {
          if (Utils.areBuffersEqual(function_name_bytes_list[index], function_name_4bytes)) {
            function_name_include = true;
            break;
          }
        }

        if (!function_name_include) {
          throw new Errors.ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED('Such function (' + function_name + ') does not exist in this callable structure.');
        }

        const concat_bytes_list = [
          this._ProtocolCodes.callable_struture_call,
          callable_struture_id_8bytes,
          function_name_4bytes
        ];

        // Encoding parameters for remote.
        for (const index in args) {
          const arg = args[index];
          const runtime_encoded = encode_runtime(arg);
          concat_bytes_list.push(Buf.encodeUInt32BE(runtime_encoded.length));
          concat_bytes_list.push(runtime_encoded);
        }

        remote_callable_strutures_list[peer_identifier-1][callable_struture_id_8bytes.toString('base64')] = callable_struture_remote;

        on_data_from_nsdt_embedded_protocol_listener(peer_identifier_int, Buf.concat(concat_bytes_list));
      });

      return callable_struture_remote;
    } else return this.decode(noxerve_supported_data_type_blob);
  }

  const on_data_from_nsdt_embedded_protocol = (listener) => {
    on_data_from_nsdt_embedded_protocol_listener = listener;
  };

  const emit_data_to_nsdt_embedded_protocol = (peer_identifier_int, data) => {
    const protocol_code = data[0];
    if (protocol_code === this._ProtocolCodes.callable_struture_call[0]) {
      const callable_struture_id_8bytes = data.slice(1, 9);
      const function_name = this._hash_manager.stringify4BytesHash(data.slice(9, 13));
      let args = [];

      for (let enumerated_bytes_count = 13; enumerated_bytes_count < data.length;) {
        const arg_length = Buf.decodeUInt32BE(data.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
        const arg_bytes = data.slice(enumerated_bytes_count + 4, enumerated_bytes_count + 4 + arg_length);
        enumerated_bytes_count = enumerated_bytes_count + 4 + arg_length;
        args.push(decode_runtime(arg_bytes));
      }

      // Call callable_struture.
      callable_strutures_dict[callable_struture_id_8bytes.toString('base64')].emitEventListener('call-request', function_name, args);
    } else if (protocol_code === this._ProtocolCodes.volatilizing_callback_call[0]) {
      const volatilizing_callback_id_8bytes = data.slice(1, 9);
      const volatilizing_callback_id_base64 = volatilizing_callback_id_8bytes.toString('base64');
      let args = [];

      for (let enumerated_bytes_count = 9; enumerated_bytes_count < data.length;) {
        const arg_length = Buf.decodeUInt32BE(data.slice(enumerated_bytes_count, enumerated_bytes_count + 4));
        const arg_bytes = data.slice(enumerated_bytes_count + 4, enumerated_bytes_count + 4 + arg_length);
        enumerated_bytes_count = enumerated_bytes_count + 4 + arg_length;
        args.push(decode_runtime(arg_bytes));
      }

      // Call volatilizing_callbacks_dict.
      volatilizing_callbacks_dict[volatilizing_callback_id_base64].apply(null, args);
      delete volatilizing_callbacks_dict[volatilizing_callback_id_base64];
    } else if (protocol_code === this._ProtocolCodes.callable_struture_close[0]) {
      const callable_struture_id_8bytes = data.slice(1, 9);
      const callable_struture_id_8bytes_base64 = callable_struture_id_8bytes.toString('base64');
      remote_callable_strutures_list[peer_identifier_int-1][callable_struture_id_8bytes_base64].emitEventListener('close');
      delete remote_callable_strutures_list[peer_identifier_int-1];
    }
  };

  const destroy = () => {
    for (const index in callable_strutures_dict) {
      callable_strutures_dict[index].emitEventListener('passively-close');
      delete callable_strutures_dict[index];
    }
    for (const index in volatilizing_callbacks_dict) {
      delete volatilizing_callbacks_dict[index];
    }
    for (const index in remote_callable_strutures_list) {
      for (const index2 in remote_callable_strutures_list[index]) {
        remote_callable_strutures_list[index][index2].emitEventListener('close');
        delete remote_callable_strutures_dict[index][index2];
      }
      delete remote_callable_strutures_list[index];
    }
  };

  for(let i = 0; i < max_peer_identifier_int; i++) {
    remote_callable_strutures_list.push([]);
  }

  callback(false, encode_runtime, decode_runtime, on_data_from_nsdt_embedded_protocol, emit_data_to_nsdt_embedded_protocol, destroy);

  // let index = 0;
  // const next = () => {
  //   const peer_identifier_int = index + 1;
  //   if(index < max_peer_identifier_int) {
  //     on_data_from_nsdt_embedded_protocol((data) => {
  //       on_data_from_nsdt_embedded_protocol_listener(peer_identifier_int, data);
  //     });
  //     bidirectional_runtime_protocol_of_each_connection_list[peer_identifier_int] = {
  //       encode_runtime: (noxerve_supported_data_type_object) => {
  //
  //       },
  //       decode_runtime: (noxerve_supported_data_type_blob) => {
  //
  //       },
  //       emit_data_to_nsdt_embedded_protocol:  (data) => {
  //
  //       },
  //       destroy: () => {
  //
  //       }
  //     };
  //     index++;
  //     next();
  //   }
  //   else {
  //     callback(false, encode_runtime, decode_runtime, on_data_from_nsdt_embedded_protocol, emit_data_to_nsdt_embedded_protocol, destroy);
  //   }
  // };
  // next();
};

module.exports = {
  protocol_name: 'nsdt_embedded',
  related_module_name: 'nsdt',
  module: NSDTEmbeddedProtocol
};

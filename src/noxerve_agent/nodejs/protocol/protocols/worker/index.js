/**
 * @file NoXerveAgent worker protocol index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const Crypto = require('crypto');
const NSDT = require('../../../nsdt');
const NonUniformProtocol = require('./non_uniform');

/**
 * @constructor module:WorkerProtocol
 * @param {object} settings
 * @description NoXerve Agent ServiceProtocol Object. Protocols of service module.
 */
function WorkerProtocol(settings) {
  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._worker_module = settings.related_module;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description Open a handshake.
   */
  this._open_handshake_function = settings.open_handshake;

  /**
   * @memberof module:WorkerProtocol
   * @type {integer}
   * @private
   * @description WorkerId. 0 as initial value.
   */
  this._worker_id = 0;

  /**
   * @memberof module:WorkerProtocol
   * @type {buffer}
   * @private
   * @description Worker authenticity data. Avoid being hacked. Provide in handshake communication.
   */
  this._worker_authenticity_data_buffer;

  /**
   * @memberof module:WorkerProtocol
   * @type {buffer}
   * @private
   * @description Worker authenticity data. Avoid being hacked. Provide in handshake communication.
   */
  this._non_uniform_list_hash_4bytes;

  // /**
  //  * @memberof module:WorkerProtocol
  //  * @type {object}
  //  * @private
  //  * @description WorkerId as key tunnel as value dictionary.
  //  */
  // this._peers_worker_id_to_tunnel_dict = {};
  //

  /**
   * @memberof module:WorkerProtocol
   * @type {array}
   * @private
   * @description NonUniform name list. NonUniform names that the service needed.
   */
  this._non_uniform_list = [];

  /**
   * @memberof module:WorkerProtocol
   * @type {array}
   * @private
   * @description NonUniform name dictionary.
   */
  this._non_uniform_name_to_detail_dict = {};
  //
  // /**
  //  * @memberof module:WorkerProtocol
  //  * @type {object}
  //  * @private
  //  * @description NonUniform name list. NonUniform names of non_uniforms that this service worker have.
  //  * With name as key, ready, non_uniform_peers as value.
  //  */
  // this._non_uniform_handle_dict = {};
  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._string_to_hash = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._hash_to_string = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {integer}
   * @private
   */
  this._peers_worker_id_checksum;
}

/**
 * @memberof module:WorkerProtocol
 * @param {array} worker_id_list
 * @private
 */
WorkerProtocol.prototype._update_peers_worker_id_checksum = function(worker_id_list) {
  let peers_worker_id_checksum = this._worker_id;
  for(const index in worker_id_list) {
    worker_id_list[index] = parseInt(worker_id_list[index]);
    peers_worker_id_checksum += worker_id_list[index];
  }
  this._peers_worker_id_checksum = peers_worker_id_checksum;
  return peers_worker_id_checksum;
}

/**
 * @memberof module:WorkerProtocol
 * @param {string} string
 * @private
 */
WorkerProtocol.prototype._hash_string_4bytes = function(string) {
  let result = this._string_to_hash[string];
  if (!result) {
    const hash_sha256 = Crypto.createHash('md5');
    hash_sha256.update(string);
    result = hash_sha256.digest().slice(0, 4);
    this._string_to_hash[string] = result;
    this._hash_to_string[result.toString('base64')] = string;
  }

  return result;
}

/**
 * @memberof module:WorkerProtocol
 * @param {buffer} _4bytes_hash
 * @private
 */
WorkerProtocol.prototype._stringify_4bytes_hash = function(_4bytes_hash) {
  return this._hash_to_string[_4bytes_hash.toString('base64')];
}

/**
 * @callback module:WorkerProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:ServiceProtocol
 * @param {module:WorkerProtocol~callback_of_start} callback
 * @description Start running WorkerProtocol.
 */
WorkerProtocol.prototype.start = function(callback) {
  if(callback) callback(false);
  this._worker_module.on('worker-authenticity-data-import', (worker_id, worker_authenticity_information, callback) => {
    this._worker_id = worker_id;
    this._worker_authenticity_data_buffer = NSDT.encode(worker_authenticity_information);
    if(worker_id) callback(false);
    // [Flag] Uncatogorized error.
    else callback(true);
  });

  this._worker_module.on('non_uniform-list-import', (non_uniform_name_list, callback) => {
    non_uniform_name_list.sort();
    if(Array.isArray(non_uniform_name_list)) {
      this._non_uniform_list = non_uniform_name_list;

      // Create _non_uniform_list_hash_4bytes.
      let non_uniform_name_concat_string = '';
      for(const index in non_uniform_name_list) {
        const non_uniform_name = non_uniform_name_list[index];

        non_uniform_name_concat_string += non_uniform_name;

        // Initialize dictionary.
        this._worker_module.emitEventListener('non_uniform-of-worker-request', (error, non_uniform) => {
          this._non_uniform_name_to_detail_dict[non_uniform_name] = {
            ready: false,
            is_claimed: false,
            non_uniform_protocol_module: new NonUniformProtocol({
              non_uniform_module: non_uniform
            })
          };
        });
      }
      // console.log(non_uniform_name_concat_string);
      this._non_uniform_list_hash_4bytes = this._hash_string_4bytes(non_uniform_name_concat_string);

      callback(false);
    }
    // [Flag] Uncatogorized error.
    else callback(true);
  });

  this._worker_module.on('non_uniform-handle', (non_uniform_name, peers_worker_id_to_interfaces_dict, least_connection_percent, callback) => {
    if(this._worker_id === 0) {
      // [Flag] Uncatogorized error
      callback(1);
      return;
    }
    else if(!this._non_uniform_list.includes(non_uniform_name)) {
      // [Flag] Uncatogorized error
      callback(2);
      return;
    }

    delete peers_worker_id_to_interfaces_dict[this._worker_id];

    const non_uniform_name_hash_4bytes = this._hash_string_4bytes(non_uniform_name);
    const peers_worker_id_list_shuffled = Utils.shuffleArray(Object.keys(peers_worker_id_to_interfaces_dict));
    const least_connection_count = Math.ceil((peers_worker_id_list_shuffled.length * least_connection_percent) / 100);


    // Register non_uniform as claimed.
    this._non_uniform_name_to_detail_dict[non_uniform_name].is_claimed = true;
    // For authenticity.
    let peers_worker_id_checksum = this._update_peers_worker_id_checksum(peers_worker_id_list_shuffled);

    // Including yourself.
    let connection_count = 1;
    // Create worker peers checksum.
    for(const index in peers_worker_id_list_shuffled) {
      // Get worker id and it's interfaces from peer list.
      const worker_id = peers_worker_id_list_shuffled[index];
      const interfaces = peers_worker_id_to_interfaces_dict[worker_id];

      let loop_index = 0;

      const next_loop = ()=> {
        loop_index++;
        if(loop_index < interfaces.length) {
          loop_over_interfaces();
        }
      };

      // Check every interface of this worker has until connected or looped to end.
      const loop_over_interfaces = ()=> {
        const interface_name = interfaces[loop_index].interface_name;
        const interface_connect_settings = interfaces[loop_index].interface_connect_settings;

        const synchronize_information = Buf.concat([
          Buf.from([2]),
          Buf.encodeUInt32BE(this._worker_id),
          non_uniform_name_hash_4bytes,
          this._non_uniform_list_hash_4bytes,
          Buf.from([Math.floor(this._peers_worker_id_checksum/256), this._peers_worker_id_checksum%256]),
          this._worker_authenticity_data_buffer
        ]);

        const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information) => {
          if(open_handshanke_error) {
            next_loop();
          }
          console.log('synchronize_acknowledgement_information', open_handshanke_error, synchronize_acknowledgement_information);
          return Buf.from([0x01]);
        };

        const finish_handshake = (error, tunnel) => {
          this._non_uniform_name_to_detail_dict[non_uniform_name].non_uniform_protocol_module.handleTunnel(worker_id, tunnel);
          console.log(error, tunnel);
        };

        this._open_handshake_function(interface_name, interface_connect_settings, synchronize_information, acknowledge_synchronization, finish_handshake);
      };

      // Start looping.
      loop_over_interfaces();
    }
  });

  this._worker_module.on('non_uniform-request', (non_uniform_name, peers_worker_id_to_interfaces_dict, callback) => {

  });

  // this._worker_module.on('non_uniforms-list-fulfill', (non_uniform_name_to_intefaces_dict, callback) => {
  //
  // });
}

/**
 * @callback module:WorkerProtocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerProtocol
 * @param {module:WorkerProtocol~callback_of_close} callback
 * @description Close the module.
 */
WorkerProtocol.prototype.close = function(callback) {
  if(callback) callback(false);
}

/**
 * @memberof module:ServiceProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge) {
  // Synchronize information for handshake
  // Format:
  // worker byte
  // 0x02 handle-non_uniform
  // 0x03 request-non_uniform

  if (synchronize_information[0] === 0x02 || synchronize_information[0] === 0x03) {
    const worker_id = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));
    const non_uniform_name = this._stringify_4bytes_hash(synchronize_information.slice(5, 9));

    onError((error) => {
      return false;
    });

    onAcknowledge((acknowledge_information, tunnel) => {
      if (acknowledge_information[0] === 0x01) {
        console.log(this._non_uniform_name_to_detail_dict[non_uniform_name]);
        this._non_uniform_name_to_detail_dict[non_uniform_name].non_uniform_protocol_module.handleTunnel(worker_id, tunnel);
        console.log('acknowledge_information', acknowledge_information);
      } else {
        return false;
      }
    });

    if(synchronize_information[0] === 0x02) {
      // Check non_uniform_list_hash_4bytes match.
      console.log('synchronize_information', synchronize_information);

      if(
        // NonUniform name exists.
        non_uniform_name
        &&
        // Check non_uniform_list_hash_4bytes is equal.
        Utils.areBuffersEqual(synchronize_information.slice(9, 13), this._non_uniform_list_hash_4bytes.slice(0, 4))
        &&
        // Check peers_worker_id_checksum is equal. First byte.
        Math.floor(this._peers_worker_id_checksum/256) === synchronize_information[13]
        &&
        // Check peers_worker_id_checksum is equal. Second byte.
        this._peers_worker_id_checksum%256 === synchronize_information[14]
      ){
        const synchronize_acknowledgement_information = this._worker_module.emitEventListener('worker-authenticication', NSDT.decode(synchronize_information.slice(15)));
        if(synchronize_acknowledgement_information) {
          console.log(non_uniform_name);
          return Buf.concat([Buf.from([0x01]), NSDT.encode(synchronize_acknowledgement_information)]);

        }
        else {
          return Buf.from([0x00, 0x01]);
        }
      }
      else {
        return Buf.from([0x00, 0x00]);
      }
    }
    else {

    }
  } else return false;
}


module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

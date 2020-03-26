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
const NSDT = require('../../../nsdt');
const WorkerSocketProtocol = require('./non_uniform/worker_socket');

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
   * @description WorkerId.
   */
  this._my_worker_id = null;

  /**
   * @memberof module:WorkerProtocol
   * @type {buffer}
   * @private
   * @description WorkerId.
   */
  this._my_worker_id_4bytes;

  /**
   * @memberof module:WorkerProtocol
   * @type {buffer}
   * @private
   * @description Worker authenticity data. Avoid being hacked. Provide in handshake communication.
   */
  this._my_worker_authenticity_data_bytes;

  /**
   * @memberof module:WorkerProtocol
   * @type {buffer}
   * @private
   * @description Worker authenticity data. Avoid being hacked.
   */
  this._worker_peers_ids_checksum_4bytes;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description Dictionary from worker id to interfaces and details.
   */
  this._workers_settings = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;
}

/**
 * @memberof module:ActivityProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._ProtocolCodes = {
  worker_affairs: Buf.from([0x02]),
  worker_socket: Buf.from([0x03])
}

/**
 * @memberof module:WorkerProtocol
 * @param {array} peers_worker_id_list
 * @private
 */
WorkerProtocol.prototype._updateWorkerPeersIdsChecksum4Bytes = function(peers_worker_id_list) {
  for (const index in peers_worker_id_list) {
    peers_worker_id_list[index] = parseInt(peers_worker_id_list[index]);
    worker_peers_ids_checksum_bytes += peers_worker_id_list[index];
  }
  this._worker_peers_ids_checksum_4bytes = worker_peers_ids_checksum_bytes;
  return worker_peers_ids_checksum_bytes;
}

/**
 * @memberof module:WorkerProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._open_handshake_from_worker_id = function(
  worker_id, synchronize_information, acknowledge_synchronization, finish_handshake) {
  const interfaces = this._workers_settings[worker_id].interfaces;

  // Stage 0: If loop to the end call acknowledge_synchronization with error.
  // Stage 1: If next_loop then call finish_handshake with error.
  let stage = 0;
  let index = 0;
  const loop_next = () => {
    index++;
    if (stage === 1) {
      // [Flag] Uncatogorized error.
      finish_handshake(true);
    } else if (index < interfaces.length) {
      loop();
    }
    // No more next loop. Exit.
    else {
      // [Flag] Uncatogorized error.
      acknowledge_synchronization(true);
    }
  };

  const loop = () => {
    const interface_name = interfaces[index].interface_name;
    const interface_connect_settings = interfaces[index].interface_connect_settings;

    // "_" is for distincting the one from parameters.
    const _acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information) => {
      if (open_handshanke_error) {
        // Unable to open handshake. Next loop.
        loop_next();

        // Return acknowledge_information(not acknowledge).
        return false;
      } else {
        stage = 1;

        // acknowledge_synchronization obtained from parameters.
        return acknowledge_synchronization(open_handshanke_error, synchronize_acknowledgement_information);
      }
    };

    // "_" is for distincting the one from parameters.
    const _finish_handshake = (error, tunnel) => {
      // finish_handshake obtained from parameters.
      finish_handshake(error, tunnel);
    };

    // Callbacks setup completed. Start handshake process.
    this._open_handshake_function(interface_name, interface_connect_settings, synchronize_information, _acknowledge_synchronization, _finish_handshake);
  };
  loop();
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
  if (callback) callback(false);

  this._worker_module.on('worker-authenticity-data-import', (worker_id, worker_authenticity_information, callback) => {
    if (worker_id) {
      this._my_worker_id = worker_id;
      this._my_worker_id_4bytes = Buf.encodeUInt32BE(worker_id);
      this._my_worker_authenticity_data_bytes = NSDT.encode(worker_authenticity_information);
      callback(false);
    }
    // [Flag] Uncatogorized error.
    else callback(true);
  });

  this._worker_module.on('workers-settings-import', (workers_settings, callback) => {
    if (this._my_worker_id === null) {
      // [Flag] Uncatogorized error.
      callback('You have to import auth data first.');
      return;
    }

    // Check the validability of imported workers_settings.
    const required_fields = ['interfaces', 'detail'];
    let worker_peers_ids_checksum = 0;
    let include_myself = false;
    // Loop over all workers.
    for (const index in workers_settings) {

      // Obtain keys from specified worker.
      const keys = Object.keys(workers_settings[index]);
      const worker_id = parseInt(index);
      worker_peers_ids_checksum += worker_id;
      if (worker_id === this._my_worker_id) include_myself = true;

      // Check worker id is integer.
      if (worker_id === NaN) {
        // [Flag] Uncatogorized error.
        callback(parseInt(index));
        return;
      } else {
        // Check required field is included.
        for (const index2 in required_fields) {
          if (!keys.includes(required_fields[index2])) {
            // [Flag] Uncatogorized error.
            callback(required_fields[index2]);
            return;
          }
        }
      }
    }
    if (!include_myself) {
      // [Flag] Uncatogorized error.
      callback(this._my_worker_id);
      return;
    }
    this._worker_peers_ids_checksum_4bytes = Buf.encodeUInt32BE(worker_peers_ids_checksum);
    // Peacefully finish the job.
    callback(false);
  });

  this._worker_module.on('worker-socket-create',
    (worker_socket_purpose_name, worker_socket_purpose_parameters, remote_worker_id, callback) => {
      const worker_socket_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_socket_purpose_name);
      const worker_socket_purpose_parameters_encoded = NSDT.encode(worker_socket_purpose_parameters);

      const synchronize_information = Buf.concat([
        this._ProtocolCodes.worker_socket,
        worker_socket_purpose_name_4bytes,
        worker_socket_purpose_parameters_encoded
      ]);

      const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information)=> {
        if(open_handshanke_error) {
          callback(open_handshanke_error);
        } else {

        }
      };

      const finish_handshake = (error, tunnel)=> {
        if(error) {
          callback(error);
        } else {
          this._worker_module.emitEventListener('worker-socket-request', (error, worker_socket)=> {

          });
        }
      };

      this._open_handshake_from_worker_id(remote_worker_id);
    });

  this._worker_module.on('me-join', () => {});

  this._worker_module.on('me-update', () => {});

  this._worker_module.on('me-leave', () => {});

  this._worker_module.on('by-worker-id-leave', () => {});

  this._worker_module.on('', () => {});

  // this._worker_module.on('worker_sockets-list-fulfill', (worker_socket_name_to_intefaces_dict, callback) => {
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
  if (callback) callback(false);
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
  // 0x02 worker-affairs
  // 0x03 worker-socket

  if (synchronize_information[0] === 0x02 || synchronize_information[0] === 0x03) {
    const worker_id = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));

    onError((error) => {
      return false;
    });

    onAcknowledge((acknowledge_information, tunnel) => {
      if (acknowledge_information[0] === 0x01) {} else {
        return false;
      }
    });

    if (synchronize_information[0] === 0x02) {
      // Check worker_socket_list_hash_4bytes match.
      console.log('synchronize_information', synchronize_information);

      if (
        // WorkerSocket worker id exists.
        worker_id
      ) {
        const synchronize_acknowledgement_information = this._worker_module.emitEventListener('worker-authenticication', NSDT.decode(synchronize_information.slice(15)));
        if (synchronize_acknowledgement_information) {
          console.log(worker_socket_name);
          return Buf.concat([Buf.from([0x01]), NSDT.encode(synchronize_acknowledgement_information)]);

        } else {
          return Buf.from([0x00, 0x01]);
        }
      } else {
        return Buf.from([0x00, 0x00]);
      }
    } else {

    }
  } else return false;
}


module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

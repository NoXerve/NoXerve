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
  this._worker_peers_settings = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description WorkerSocketProtocol submodule.
   */
  this._worker_socket_protocol = new WorkerSocketProtocol({
    hash_manager: settings.hash_manager
  });

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
  worker_affairs_worker_join_request_respond: Buf.from([0x01]),
  worker_affairs_worker_join_broadcast: Buf.from([0x01]),
  worker_affairs_worker_update_broadcast: Buf.from([0x01]),
  worker_affairs_worker_leave_broadcast: Buf.from([0x01]),
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
  const interfaces = this._worker_peers_settings[worker_id].interfaces;

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

  this._worker_module.on('workers-settings-import', (worker_peers_settings, callback) => {
    if (this._my_worker_id === null) {
      // [Flag] Uncatogorized error.
      callback('You have to import auth data first.');
      return;
    }

    // Check the validability of imported worker_peers_settings.
    const required_fields = ['interfaces', 'detail'];
    let worker_peers_ids_checksum = 0;
    let include_myself = false;
    // Loop over all workers.
    for (const index in worker_peers_settings) {

      // Obtain keys from specified worker.
      const keys = Object.keys(worker_peers_settings[index]);
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
    this._worker_peers_settings = worker_peers_settings;
    this._worker_peers_ids_checksum_4bytes = Buf.encodeUInt32BE(worker_peers_ids_checksum);
    // Peacefully finish the job.
    callback(false);
  });

  this._worker_module.on('worker-socket-create',
    (worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, callback) => {
      const worker_socket_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_socket_purpose_name);
      const worker_socket_purpose_parameter_encoded = NSDT.encode(worker_socket_purpose_parameter);

      const synchronize_information = Buf.concat([
        this._ProtocolCodes.worker_socket,
        this._my_worker_id_4bytes,
        Buf.encodeUInt32BE(this._my_worker_authenticity_data_bytes.length),
        this._my_worker_authenticity_data_bytes,
        worker_socket_purpose_name_4bytes,
        worker_socket_purpose_parameter_encoded
      ]);

      let remote_authenticication_passed = false;

      const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information) => {
        if (open_handshanke_error) {
          callback(open_handshanke_error);
        } else if (synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_socket[0] &&
          synchronize_acknowledgement_information[1] === 0x01
        ) {
          const remote_worker_authenticity_data = NSDT.decode(synchronize_acknowledgement_information.slice(2));
          // Auth remote worker.
          const is_auth_passed = this._worker_module.emitEventListener('worker-authenticication', remote_worker_id, remote_worker_authenticity_data);
          remote_authenticication_passed = is_auth_passed;

          if (is_auth_passed) {
            return Buf.concat([
              this._ProtocolCodes.worker_socket,
              Buf.from([0x01]), // Accept.
            ]);
          } else {
            return Buf.concat([
              this._ProtocolCodes.worker_socket,
              Buf.from([0x00]), // Reject.
              Buf.from([0x00]) // Reject. Authenticication error.
            ]);
          }

        } else if (synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_socket[0] &&
          synchronize_acknowledgement_information[1] === 0x00
        ) {
          if(synchronize_acknowledgement_information[2] === 0x00) {

            // [Flag] Uncatogorized error.
            callback('worker authenticication error.');
            return false;
          }
          else {

            // [Flag] Uncatogorized error.
            callback('Unknown error');
            return false;
          }
        } else {
          callback('Unknown protocol');
          return false;
        }
      };

      const finish_handshake = (error, tunnel) => {
        if (error) {
          callback(error);
        } else {
          if(remote_authenticication_passed) {
            this._worker_module.emitEventListener('worker-socket-request', (error, worker_socket) => {
              this._worker_socket_protocol.handleTunnel(error, worker_socket, tunnel);
              callback(error, worker_socket);
            });
          }
          else {
            // [Flag] Uncatogorized error.
            callback('Remote worker authenticication failed.');
          }
        }
      };

      this._open_handshake_from_worker_id(remote_worker_id, synchronize_information, acknowledge_synchronization, finish_handshake);
    });

  this._worker_module.on('hash-string-request', (worker_socket_purpose_name) => {
    this._hash_manager.hashString4Bytes(worker_socket_purpose_name);
  });

  this._worker_module.on('me-join', () => {
    if(this._my_worker_id === null || this._my_worker_id === 0) {

    }
    else {

    }
  });

  this._worker_module.on('me-update', () => {});

  this._worker_module.on('me-leave', () => {});

  this._worker_module.on('by-worker-id-leave', () => {});

  // this._worker_module.on('', () => {});
  if (callback) callback(false);
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
  if (
    synchronize_information[0] === this._ProtocolCodes.worker_affairs[0] ||
    synchronize_information[0] === this._ProtocolCodes.worker_socket[0]) {
    const worker_id = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));

    if (synchronize_information[0] === this._ProtocolCodes.worker_affairs[0]) {
      // Check worker_socket_list_hash_4bytes match.
      console.log('synchronize_information', synchronize_information);


    } else if (synchronize_information[0] === this._ProtocolCodes.worker_socket[0]) {
      const remote_worker_id = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));
      const remote_worker_authenticity_data_length = Buf.decodeUInt32BE(synchronize_information.slice(5, 9));
      const remote_worker_authenticity_data = NSDT.decode(synchronize_information.slice(9, 9 + remote_worker_authenticity_data_length));
      const worker_socket_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_information.slice(9 + remote_worker_authenticity_data_length, 9 + remote_worker_authenticity_data_length + 4));
      const worker_socket_purpose_parameter = NSDT.decode(synchronize_information.slice(9 + remote_worker_authenticity_data_length + 4));
      const is_auth_passed = this._worker_module.emitEventListener('worker-authenticication', remote_worker_id, remote_worker_authenticity_data);
      // console.log(is_auth_passed, remote_worker_id, remote_worker_authenticity_data_length, remote_worker_authenticity_data, worker_socket_purpose_name, worker_socket_purpose_parameter);

      onError((error) => {
        return false;
      });

      onAcknowledge((acknowledge_information, tunnel) => {
        if (acknowledge_information[0] === this._ProtocolCodes.worker_socket[0] &&
          acknowledge_information[1] === 0x01
        ) {
          this._worker_module.emitEventListener('worker-socket-request', (error, worker_socket) => {
            this._worker_socket_protocol.handleTunnel(error, worker_socket, tunnel);
            this._worker_module.emitEventListener('worker-socket-ready', worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, worker_socket);
          });
        } else {
          tunnel.close();
          return false;
        }
      });

      if (is_auth_passed) {
        return Buf.concat([
          this._ProtocolCodes.worker_socket,
          Buf.from([0x01]), // Accept.
          this._my_worker_authenticity_data_bytes
        ]);
      } else {
        return Buf.concat([
          this._ProtocolCodes.worker_socket,
          Buf.from([0x00]), // Reject.
          Buf.from([0x00]) // Reject. Authenticication error.
        ]);
      }
    }
  } else return false;
}


module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

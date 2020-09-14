/**
 * @file NoXerveAgent worker protocol index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerProtocol
 */
// Initial supported protocols detail.
const WorkerSubprotocolsPath = require("path").join(__dirname, "./worker_subprotocols");
const MAX_CONCURRENT_CONNECTIONS_COUNT = 30; // Not yet decided how this parameter to be set.

let WorkerSubprotocols = {};

// Load avaliable protocols auto-dynamicly.
require("fs").readdirSync(WorkerSubprotocolsPath).forEach((file_name) => {
  const protocol = require(WorkerSubprotocolsPath + "/" + file_name);

  // Mapping protocol's name from specified module.
  if (protocol.protocol_name) {
    WorkerSubprotocols[protocol.protocol_name] = protocol;
  };

});

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');

/**
 * @constructor module:WorkerProtocol
 * @param {object} settings
 * @description NoXerve Agent WorkerProtocol Object. Protocols of worker module.
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
   * @description static_global_random_seed_4096bytes for GlobalDeterministicRandomManager.
   */
  this._static_global_random_seed_4096bytes;

  /**
   * @memberof module:WorkerProtocol
   * @type {buffer}
   * @private
   * @description static_global_random_seed_checksum_4bytes.
   */
  this._static_global_random_seed_checksum_4bytes = Buf.from([0, 0, 0, 0]);

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
   * @description Subprotocols.
   */
  this._subprotocol_modules = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.embedded_protocols['nsdt_embedded'];

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._base64_to_scope_dict = {};

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._worker_object_protocol_with_worker_subprotocol_modules_dict = {};
}

/**
 * @memberof module:ActivityProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._ProtocolCodes = {
  // Root protocol code
  worker_affairs: Buf.from([0x02]),
  worker_affairs_worker_peer_join_request_respond: Buf.from([0x01]),
  worker_affairs_worker_peer_update_request_respond: Buf.from([0x02]),
  worker_affairs_worker_peer_leave_request_respond: Buf.from([0x03]),
  worker_affairs_worker_peer_join_broadcast: Buf.from([0x04]),
  worker_affairs_worker_peer_update_broadcast: Buf.from([0x05]),
  worker_affairs_worker_peer_leave_broadcast: Buf.from([0x06]),
  worker_affairs_worker_peer_operation_comfirm_broadcast: Buf.from([0x07]),
  worker_affairs_worker_peer_operation_cancel_broadcast: Buf.from([0x08]),
  // Worker Object protocol
  worker_object: Buf.from([0x03]),

  accept: Buf.from([0x01]),
  reject: Buf.from([0x00]),
  unknown_reason_reject_2_bytes: Buf.from([0x00, 0x01]),
  authentication_reason_reject_2_bytes: Buf.from([0x00, 0x02])
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._broadcastWorkerAffairsWorkerPeerOperation = function(operation_type, target_worker_peer_worker_id, broadcast_bytes, callback) {
  const worker_affairs_worker_peer_operations_ProtocolCodes = {
    'join': this._ProtocolCodes.worker_affairs_worker_peer_join_broadcast,
    'update': this._ProtocolCodes.worker_affairs_worker_peer_update_broadcast,
    'leave': this._ProtocolCodes.worker_affairs_worker_peer_leave_broadcast
  };

  const my_worker_authenticity_bytes = this._encodeAuthenticityBytes();
  const worker_peer_opreation_byte = worker_affairs_worker_peer_operations_ProtocolCodes[operation_type];

  const worker_affairs_worker_peer_join_broadcast_bytes = Buf.concat([
    this._ProtocolCodes.worker_affairs,
    worker_peer_opreation_byte,

    // My
    Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
    my_worker_authenticity_bytes,

    // Remote
    broadcast_bytes
  ]);

  const on_a_worker_response = (worker_id, error, response_bytes, next_of_on_a_worker_response) => {
    if (error) {
      next_of_on_a_worker_response(error, false);
    } else if (response_bytes[0] === this._ProtocolCodes.worker_affairs[0] && response_bytes[1] === worker_peer_opreation_byte[0]) {
      if (response_bytes[2] === this._ProtocolCodes.accept[0]) {
        next_of_on_a_worker_response(error, true);
      } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
        // [Flag]
        next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);
      } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
        // [Flag]
        next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);
      } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), Buf.from([0x00, 0x02]))) {
        // [Flag]
        next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker affairs operation collision error.'), false);
      } else {
        // [Flag]
        next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
      }
    }
  };

  const on_finish = (error, finished_worker_ids_list) => {
    const encoded_authenticity_bytes = this._encodeAuthenticityBytes();
    if (error) {
      // Cancel all operation done.
      const worker_affairs_worker_peer_operation_cancel_broadcast_bytes = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
        Buf.encodeUInt32BE(target_worker_peer_worker_id),
        encoded_authenticity_bytes
      ]);

      const on_a_worker_response = (worker_id, error, response_bytes, next_of_on_a_worker_response) => {
        if (response_bytes[0] === this._ProtocolCodes.worker_affairs[0] && response_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast[0]) {
          if (response_bytes[2] === this._ProtocolCodes.accept[0]) {
            next_of_on_a_worker_response(false, true);

          } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);

          } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);

          } else {
            next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
          }
        } else {
          next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
        }
      };

      const inner_on_finish = (error, inner_finished_worker_ids_list) => {
        if (error) {
          console.log(error, inner_finished_worker_ids_list);
        }
      };
      this._multicastRequestResponse(finished_worker_ids_list, worker_affairs_worker_peer_operation_cancel_broadcast_bytes, on_a_worker_response, inner_on_finish);
    } else {
      // Comfirm all operation done.
      const worker_affairs_worker_peer_join_comfirm_broadcast_bytes = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_peer_operation_comfirm_broadcast,
        Buf.encodeUInt32BE(target_worker_peer_worker_id),
        encoded_authenticity_bytes
      ]);

      const on_a_worker_response = (worker_id, error, response_bytes, next_of_on_a_worker_response) => {
        if (response_bytes[0] === this._ProtocolCodes.worker_affairs[0] && response_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast[0]) {
          if (response_bytes[2] === this._ProtocolCodes.accept[0]) {
            next_of_on_a_worker_response(false, true);

          } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);

          } else if (Utils.areBuffersEqual(response_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);

          } else {
            next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
          }
        } else {
          next_of_on_a_worker_response(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
        }
      };

      const inner_on_finish = (error, inner_finished_worker_ids_list) => {
        if (error) {
          console.log(error, inner_finished_worker_ids_list);
        }
        if (operation_type === 'leave') {
          // Reset worker.
          this._my_worker_id = null;
          this._my_worker_id_4bytes = null;
          this._my_worker_id_4bytes = null;
          this._my_worker_authenticity_data_bytes = null;
          this._worker_peers_ids_checksum_4bytes = null;
          this._worker_peers_settings = {};
        }
      };

      this._multicastRequestResponse(finished_worker_ids_list, worker_affairs_worker_peer_join_comfirm_broadcast_bytes, on_a_worker_response, inner_on_finish);
    }
    callback(error);
  };

  this._broadcastRequestResponseToAllWorkers(worker_affairs_worker_peer_join_broadcast_bytes, on_a_worker_response, on_finish);
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._handleWorkerAffairsWorkerPeerOperationBroadcast = function(operation_type, synchronize_information, next) {
  const worker_affairs_worker_peer_operations_ProtocolCodes = {
    'join': this._ProtocolCodes.worker_affairs_worker_peer_join_broadcast,
    'update': this._ProtocolCodes.worker_affairs_worker_peer_update_broadcast,
    'leave': this._ProtocolCodes.worker_affairs_worker_peer_leave_broadcast
  };

  const event_listener_names = {
    'join': 'worker-peer-join-request',
    'update': 'worker-peer-update-request',
    'leave': 'worker-peer-leave-request'
  };

  const worker_peer_opreation_byte = worker_affairs_worker_peer_operations_ProtocolCodes[operation_type];
  const event_listener_name = event_listener_names[operation_type];

  const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(2, 6));
  const remote_worker_peer_authenticity_bytes = synchronize_information.slice(6, 6 + remote_worker_peer_authenticity_bytes_length);
  this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
    if ((operation_type === 'update' || operation_type === 'leave') && !Object.keys(this._worker_peers_settings).includes(remote_worker_peer_worker_id + '')) {
      next(Buf.concat([
        this._ProtocolCodes.worker_affairs,
        worker_peer_opreation_byte,
        this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
      ]));
    } else if (is_authenticity_valid) {
      const bytes_offseted = synchronize_information.slice(6 + remote_worker_peer_authenticity_bytes_length);
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(bytes_offseted.slice(0, 4));
      const new_worker_peer_interfaces_connect_settings_bytes_length = (operation_type === 'leave') ? null : Buf.decodeUInt32BE(bytes_offseted.slice(4, 8));
      let new_worker_peer_interfaces_connect_settings = (operation_type === 'leave') ? null : this._nsdt_embedded_protocol.decode(bytes_offseted.slice(8, 8 + new_worker_peer_interfaces_connect_settings_bytes_length));
      let new_worker_peer_detail = (operation_type === 'leave') ? null : this._nsdt_embedded_protocol.decode(bytes_offseted.slice(8 + new_worker_peer_interfaces_connect_settings_bytes_length));

      // [Flag] Test
      // if (this._my_worker_id === 2) {
      //   this._worker_peers_settings[3] = {};
      //   this._worker_peers_settings[3]['worker_affairs_locked'] = true;
      //   console.log(this._isWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id), target_worker_peer_worker_id);
      // }

      // Check not blocked by other worker peer.
      if (this._isWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id)) {
        next(Buf.concat([
          this._ProtocolCodes.worker_affairs,
          worker_peer_opreation_byte,
          Buf.from([0x00, 0x02]), // Reject. Locked error.
          Buf.encodeUInt32BE(this._isWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id)) // Locked by whom.
        ]));
      } else {
        this._setWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id, remote_worker_peer_worker_id);
        if (operation_type === 'leave') {
          this._worker_peers_settings[target_worker_peer_worker_id].new_settings = null;
        } else if (operation_type === 'join') {
          this._worker_peers_settings[target_worker_peer_worker_id].new_settings = {
            interfaces_connect_settings: new_worker_peer_interfaces_connect_settings,
            detail: new_worker_peer_detail
          };
        } else if (operation_type === 'update') {
          // If null preserve settings.
          if (!new_worker_peer_interfaces_connect_settings) {
            new_worker_peer_interfaces_connect_settings = this._worker_peers_settings[target_worker_peer_worker_id].interfaces_connect_settings;
          }
          if (!new_worker_peer_detail) {
            new_worker_peer_detail = this._worker_peers_settings[target_worker_peer_worker_id].detail;
          }
          this._worker_peers_settings[target_worker_peer_worker_id].new_settings = {
            interfaces_connect_settings: new_worker_peer_interfaces_connect_settings,
            detail: new_worker_peer_detail
          };
        }

        const next_of_worker_module = (error, on_cancel) => {
          this._worker_peers_settings[target_worker_peer_worker_id].on_worker_affairs_worker_peer_operation_cancel = on_cancel;
          if (error) {
            next(Buf.concat([
              this._ProtocolCodes.worker_affairs,
              worker_peer_opreation_byte,
              this._ProtocolCodes.unknown_reason_reject_2_bytes // Reject. Authenticication error.
            ]));
          } else {
            // this._worker_peers_settings[target_worker_peer_worker_id] = {
            //   interfaces: new_worker_peer_interfaces_connect_settings,
            //   detail: new_worker_peer_detail
            // };
            next(Buf.concat([
              this._ProtocolCodes.worker_affairs,
              worker_peer_opreation_byte,
              this._ProtocolCodes.accept // Reject. Authenticication error.
            ]));
          }
        };
        if (operation_type === 'leave') {
          this._worker_module.emitEventListener(event_listener_name, target_worker_peer_worker_id, next_of_worker_module);
        } else {
          this._worker_module.emitEventListener(event_listener_name, target_worker_peer_worker_id, new_worker_peer_interfaces_connect_settings, new_worker_peer_detail, next_of_worker_module);
        }
      }
    } else {
      next(Buf.concat([
        this._ProtocolCodes.worker_affairs,
        worker_peer_opreation_byte,
        this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
      ]));
    }
  });
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._updateWorkerPeersIdsChecksum4Bytes = function(peers_worker_ids_list) {
  let worker_peers_ids_checksum = 0;
  for (const index in peers_worker_ids_list) {
    peers_worker_ids_list[index] = parseInt(peers_worker_ids_list[index]);
    worker_peers_ids_checksum += peers_worker_ids_list[index];
  }
  const worker_peers_ids_checksum_bytes = Buf.encodeUInt32BE(worker_peers_ids_checksum);
  this._worker_peers_ids_checksum_4bytes = worker_peers_ids_checksum_bytes;
  return worker_peers_ids_checksum_bytes;
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._openHandshakeByWorkerId = function(
  target_worker_peer_worker_id, synchronize_information, acknowledge_synchronization, finish_handshake) {
  if (!this._worker_peers_settings[target_worker_peer_worker_id]) {
    finish_handshake(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Does not exist worker peer with such worker id(' + target_worker_peer_worker_id + ').'));
    return;
  }
  const interfaces_connect_settings = this._worker_peers_settings[target_worker_peer_worker_id].interfaces_connect_settings;

  let index = 0;
  const open_handshanke_errors = [];
  const loop_next = () => {
    index++;
    if (index < interfaces_connect_settings.length) {
      loop();
    }
    // No more next loop. Exit.
    else {
      acknowledge_synchronization(open_handshanke_errors, null, () => {});
    }
  };

  const loop = () => {
    const interface_name = interfaces_connect_settings[index].interface_name;
    const interface_connect_settings = interfaces_connect_settings[index].interface_connect_settings;

    // "_" is for distincting the one from parameters.
    const _acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
      if (open_handshanke_error) {
        // Unable to open handshake. Next loop.
        open_handshanke_errors.push(open_handshanke_error);
        loop_next();

        // Return acknowledge_information(not acknowledge).
        next(false);
      } else {

        // acknowledge_synchronization obtained from parameters.
        return acknowledge_synchronization(open_handshanke_error, synchronize_acknowledgement_information, next);
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
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._multicastRequestResponse = function(worker_ids_list, data_bytes, on_a_worker_response, on_finish) {

  // Broadcast worker join start.
  // max concurrent connections.
  const max_concurrent_connections_count = MAX_CONCURRENT_CONNECTIONS_COUNT;
  const finished_worker_ids_list = [];
  let escape_loop_with_error = false;
  let worker_peers_errors = {};
  let current_connections_count = 0;
  let index = 0;
  // let errors = {};

  const loop_over_workers = () => {
    const worker_id = worker_ids_list[index];
    if (worker_id) {
      current_connections_count++;

      // Concurrently open connections.
      if (current_connections_count < max_concurrent_connections_count) {
        loop_next();
      }

      // Check worker id is not 0.
      if (parseInt(worker_id) !== 0) {
        const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
          current_connections_count--;

          next(false);
          on_a_worker_response(worker_id, open_handshanke_error, synchronize_acknowledgement_information, (error, is_finished) => {
            if (error) {
              worker_peers_errors[worker_id] = error;
              escape_loop_with_error = true;
            }
            if (is_finished) {
              finished_worker_ids_list.push(worker_id);
            }
            loop_next();
          });
        };

        const finish_handshake = (error, tunnel) => {
          // Not suppose to be called.
          // Request, response only have 2 progress instead of 3 full handshake.
        };

        this._openHandshakeByWorkerId(worker_id, data_bytes, acknowledge_synchronization, finish_handshake);
      } else {
        loop_next();
      }
    } else {
      loop_next();
    }
  };

  const loop_next = () => {
    index++;
    if (finished_worker_ids_list.length >= worker_ids_list.length) {
      on_finish(false, finished_worker_ids_list);
    } else if (escape_loop_with_error && current_connections_count === 0) {
      on_finish(worker_peers_errors, finished_worker_ids_list);
    } else if (index < worker_ids_list.length && current_connections_count < max_concurrent_connections_count) {
      loop_over_workers();
    }
  };

  loop_over_workers();
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._broadcastRequestResponseToAllWorkers = function(data_bytes, on_a_worker_response, on_finish) {
  const worker_ids_list = Object.keys(this._worker_peers_settings).map(x => parseInt(x));
  this._multicastRequestResponse(worker_ids_list, data_bytes, on_a_worker_response, on_finish);
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._encodeAuthenticityBytes = function() {
  return Buf.concat([
    this._my_worker_id_4bytes,
    this._worker_peers_ids_checksum_4bytes,
    this._static_global_random_seed_checksum_4bytes,
    this._my_worker_authenticity_data_bytes
  ]);
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._validateAuthenticityBytes = function(remote_authenticity_bytes, callback) {
  const remote_worker_peer_worker_id = Buf.decodeUInt32BE(remote_authenticity_bytes.slice(0, 4));
  const remote_worker_peers_ids_checksum_4bytes = remote_authenticity_bytes.slice(4, 8);
  const remote_worker_peers_static_global_random_seed_checksum_4bytes = remote_authenticity_bytes.slice(8, 12);
  const remote_worker_peer_authenticity_data = this._nsdt_embedded_protocol.decode(remote_authenticity_bytes.slice(12));

  // Check worker_peers_ids_checksum_4bytes.
  if (Utils.areBuffersEqual(this._worker_peers_ids_checksum_4bytes, remote_worker_peers_ids_checksum_4bytes) &&
    Utils.areBuffersEqual(this._static_global_random_seed_checksum_4bytes, remote_worker_peers_static_global_random_seed_checksum_4bytes)
  ) {
    // Emit worker authentication from worker module.
    this._worker_module.emitEventListener('worker-peer-authentication', remote_worker_peer_worker_id, remote_worker_peer_authenticity_data, (is_authenticity_valid) => {
      try {
        if (is_authenticity_valid) {
          callback(false, true, remote_worker_peer_worker_id);
        } else {
          callback(false, false, remote_worker_peer_worker_id);
        }
      } catch (error) {
        throw error;
      }
    });
  } else {
    callback(false, false, null);
  }
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._isWorkerPeerWorkerAffairsLocked = function(worker_id) {
  const worker_peer_settings = this._worker_peers_settings[worker_id];
  if (worker_peer_settings) {
    if (worker_peer_settings.worker_affairs_locked) {
      return worker_peer_settings.worker_affairs_locked;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._setWorkerPeerWorkerAffairsLocked = function(worker_id, locked_by_worker_peer_with_worker_id) {
  if (this._worker_peers_settings[worker_id]) {
    this._worker_peers_settings[worker_id].worker_affairs_locked = locked_by_worker_peer_with_worker_id;
  } else {
    this._worker_peers_settings[worker_id] = {};
    this._worker_peers_settings[worker_id].worker_affairs_locked = locked_by_worker_peer_with_worker_id;
  }
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._setWorkerPeerWorkerAffairUnLocked = function(worker_id) {
  if (!this._worker_peers_settings[worker_id].interfaces_connect_settings) {
    delete this._worker_peers_settings[worker_id];
  } else if (this._worker_peers_settings[worker_id]) {
    this._worker_peers_settings[worker_id].worker_affairs_locked = false;
  } else {
    this._worker_peers_settings[worker_id] = {};
    this._worker_peers_settings[worker_id].worker_affairs_locked = false;
  }
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._createWorkerObjectProtocolWithWorkerSubprotocolManagers = function(worker_object_protocol_code_int, callback) {
  // "worker_object_protocol_code" means worker object's protocol's register-code.
  const worker_object_protocol_code_1byte = Buf.from([worker_object_protocol_code_int]);
  let subprotocol_managers = {};
  let abort = false;
  this._worker_object_protocol_with_worker_subprotocol_modules_dict[worker_object_protocol_code_int] = {};

  // Initailize subprotocols.
  for (const protocol_name in WorkerSubprotocols) {
    // Fetch protocol.
    const Protocol = WorkerSubprotocols[protocol_name];
    const worker_subprotocol_protocol_code_1byte = Protocol.protocol_code;

    // For later uses of protocol format before payload section.
    const prefix_data_bytes = Buf.concat([
      this._ProtocolCodes.worker_object,
      worker_object_protocol_code_1byte,
      worker_subprotocol_protocol_code_1byte,
    ]);

    const protocol_module = new(Protocol.module)({
      worker_protocol_actions: {
        validateAuthenticityBytes: this._validateAuthenticityBytes.bind(this),
        encodeAuthenticityBytes: this._encodeAuthenticityBytes.bind(this),
        openHandshakeByWorkerId: (target_worker_peer_worker_id, synchronize_information, acknowledge_synchronization, finish_handshake) => {
          const decorated_synchronize_information = Buf.concat([prefix_data_bytes, synchronize_information]);
          const decorated_acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
            const decorated_next = (data_bytes) => {
              if(Buf.isBuffer(data_bytes)) {
                next(Buf.concat([prefix_data_bytes, data_bytes]));
              }
              else {
                next(false);
              }
            }
            if(
              synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_object[0] &&
              synchronize_acknowledgement_information[1] === worker_object_protocol_code_1byte[0] &&
              synchronize_acknowledgement_information[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              acknowledge_synchronization(open_handshanke_error, synchronize_acknowledgement_information.slice(3), decorated_next);
            } else {
              acknowledge_synchronization(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), synchronize_acknowledgement_information.slice(3), decorated_next);
            }
          };
          this._openHandshakeByWorkerId(target_worker_peer_worker_id, decorated_synchronize_information, decorated_acknowledge_synchronization, finish_handshake);
        },
        multicastRequestResponse: (worker_ids_list, data_bytes, on_a_worker_response, on_finish) => {
          const decorated_data_bytes = Buf.concat([prefix_data_bytes, data_bytes]);
          const decorated_on_a_worker_response = (worker_id, error, response_bytes, next) => {
            if(
              response_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              response_bytes[1] === worker_object_protocol_code_1byte[0] &&
              response_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              on_a_worker_response(worker_id, error, response_bytes.slice(3), next);
            } else {
              on_a_worker_response(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_bytes.slice(3), next);
            }
          };
          this._multicastRequestResponse(worker_ids_list, decorated_data_bytes, decorated_on_a_worker_response, on_finish);
        },
        broadcastRequestResponseToAllWorkers: (data_bytes, on_a_worker_response, on_finish) => {
          const decorated_data_bytes = Buf.concat([prefix_data_bytes, data_bytes]);
          const decorated_on_a_worker_response = (worker_id, error, response_bytes, next) => {
            if(
              response_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              response_bytes[1] === worker_object_protocol_code_1byte[0] &&
              response_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              on_a_worker_response(worker_id, error, response_bytes.slice(3), next);
            } else {
              on_a_worker_response(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_bytes.slice(3), next);
            }
          };
          this._multicastRequestResponse(worker_ids_list, decorated_data_bytes, decorated_on_a_worker_response, on_finish);
        },
      },
      hash_manager: this._hash_manager,
      nsdt_embedded_protocol: this._nsdt_embedded_protocol,
      worker_global_protocol_codes: this._ProtocolCodes
    });

    // Collect managers for callback. Asynchronizely.
    protocol_module.start((error, manager) => {
      if (abort) {
        // Aborted. Do nothing.
        return;
      } else if (error) {

        // Abort all setups.
        abort = true;
        delete this._worker_object_protocol_with_worker_subprotocol_modules_dict[worker_object_protocol_code_int];
        callback(error);
      } else {
        // Append manager.
        subprotocol_managers[protocol_name] = manager;
        this._worker_object_protocol_with_worker_subprotocol_modules_dict[worker_object_protocol_code_int][worker_subprotocol_protocol_code_1byte[0]] = protocol_module;
        // If finish appending asyncly. Call callback.
        if (Object.keys(subprotocol_managers).length === Object.keys(WorkerSubprotocols).length) {
          callback(false, subprotocol_managers);
        }
      }
    });

  }
}

/**
 * @callback module:WorkerProtocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:WorkerProtocol
 * @param {module:WorkerProtocol~callback_of_start} callback
 * @description Start running WorkerProtocol.
 */
WorkerProtocol.prototype.start = function(callback) {
  this._worker_module.on('worker-subprotocol-managers-request', (worker_object_protocol_code_int, callback) => {
    this._createWorkerObjectProtocolWithWorkerSubprotocolManagers(worker_object_protocol_code_int, callback);
  });

  this._worker_module.on('static-global-random-seed-import', (static_global_random_seed_4096bytes, callback) => {
    if (static_global_random_seed_4096bytes && Buf.isBuffer(static_global_random_seed_4096bytes) && static_global_random_seed_4096bytes.length === 4096) {
      this._static_global_random_seed_4096bytes = static_global_random_seed_4096bytes;
      this._static_global_random_seed_checksum_4bytes = Utils.hash4BytesMd5(static_global_random_seed_4096bytes);
      callback(false);
    } else callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported static global random seed buffer must have exactly 4096 bytes.'));
  });

  this._worker_module.on('my-worker-authenticity-data-import', (worker_id, worker_authenticity_information, callback) => {
    if (worker_id) {
      this._my_worker_id = worker_id;
      this._my_worker_id_4bytes = Buf.encodeUInt32BE(worker_id);
      this._my_worker_authenticity_data_bytes = this._nsdt_embedded_protocol.encode(worker_authenticity_information);
      callback(false);
    } else callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported worker authenticity data without worker id.'));
  });

  this._worker_module.on('worker-peers-settings-import', (worker_peers_settings, callback) => {
    if (this._my_worker_id === null) {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('You have to import authenticity data first.'));
      return;
    }

    // Check the validability of imported worker_peers_settings.
    const required_fields = ['interfaces_connect_settings', 'detail'];
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
        callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported worker peers settings without worker id.'));
        return;
      } else {
        // Check required field is included.
        for (const index2 in required_fields) {
          if (!keys.includes(required_fields[index2])) {
            callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported worker peers settings missing field "' + required_fields[index2] + '".'));
            return;
          }
        }

        // For worker-peer-join worker-peer-update worker-peer-leave.
        worker_peers_settings[index]['worker_affairs_locked'] = false;
      }
    }

    if (!include_myself) {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported worker peers settings must include myself.'));
      return;
    }
    this._worker_peers_settings = worker_peers_settings;

    this._worker_peers_ids_checksum_4bytes = Buf.encodeUInt32BE(worker_peers_ids_checksum);
    // Peacefully finish the job.
    callback(false);
  });

  this._worker_module.on('me-join', (remote_worker_interfaces_connect_settings, my_worker_interfaces_connect_settings, my_worker_detail, my_worker_authentication_data, me_join_callback) => {
    if (this._my_worker_id === null || this._my_worker_id === 0) {
      // [Flag] Check field.
      // Shuffle for clientwise loadbalancing.
      const shuffled_interfaces_connect_settings_list = Utils.shuffleArray(remote_worker_interfaces_connect_settings);

      const my_worker_authentication_data_bytes = this._nsdt_embedded_protocol.encode(my_worker_authentication_data);
      const my_worker_interfaces_connect_settings_bytes = this._nsdt_embedded_protocol.encode(my_worker_interfaces_connect_settings);
      const my_worker_detail_bytes = this._nsdt_embedded_protocol.encode(my_worker_detail);

      const synchronize_information = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
        Buf.encodeUInt32BE(my_worker_authentication_data_bytes.length),
        my_worker_authentication_data_bytes,
        Buf.encodeUInt32BE(my_worker_interfaces_connect_settings_bytes.length),
        my_worker_interfaces_connect_settings_bytes,
        my_worker_detail_bytes
      ]);

      // Proceed tunnel creations loop.
      let index = 0;
      // Loop loop() with condition.
      const loop_next = () => {
        index++;
        if (index < shuffled_interfaces_connect_settings_list.length) {
          loop();
        }
        // No more next loop. Exit.
        else {
          me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Could not create handshakes via imported interfaces.'));
        }
      };

      const loop = () => {
        const interface_name = shuffled_interfaces_connect_settings_list[index].interface_name;
        const interface_connect_settings = shuffled_interfaces_connect_settings_list[index].interface_connect_settings;

        const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
          if (open_handshanke_error) {
            // Unable to open handshake. Next loop.
            loop_next();

            // Return acknowledge_information(not acknowledge).
            next(false);
          } else {
            // Handshake opened. Check if synchronize_acknowledgement_information valid.
            if (synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_affairs[0] && synchronize_acknowledgement_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond[0]) {
              // Acknowledgement information for handshake
              // const acknowledge_information = this._ProtocolCodes.worker_affairs;
              if (synchronize_acknowledgement_information[2] === this._ProtocolCodes.accept[0]) {
                // Accept.
                const new_worker_id = Buf.decodeUInt32BE(synchronize_acknowledgement_information.slice(3, 7));
                const static_global_random_seed_4096bytes = synchronize_acknowledgement_information.slice(7, 7 + 4096);
                const worker_peers_settings = this._nsdt_embedded_protocol.decode(synchronize_acknowledgement_information.slice(7 + 4096));

                // Update worker peers settings
                this._worker_peers_settings = worker_peers_settings;
                this._static_global_random_seed_4096bytes = static_global_random_seed_4096bytes;
                this._static_global_random_seed_checksum_4bytes = Utils.hash4BytesMd5(static_global_random_seed_4096bytes);
                this._updateWorkerPeersIdsChecksum4Bytes(Object.keys(worker_peers_settings));

                me_join_callback(false, new_worker_id, worker_peers_settings, static_global_random_seed_4096bytes);
              } else if (Utils.areBuffersEqual(synchronize_acknowledgement_information.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
                me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'));
              } else if (Utils.areBuffersEqual(synchronize_acknowledgement_information.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
                me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'));
              } else if (Utils.areBuffersEqual(synchronize_acknowledgement_information.slice(2, 4), Buf.from([0x00, 0x02]))) {
                me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Broadcast error'));
              }
              // Return acknowledge binary.
            } else {
              loop_next();
            }
            next(false);

          }
        };

        const finish_handshake = (error, tunnel) => {
          if (error) {
            // Unable to open handshake. Next loop.
            loop_next();
          } else {
            me_join_callback(error);
          }
        };

        // Callbacks setup completed. Start handshake process (actually request response here).
        this._open_handshake_function(interface_name, interface_connect_settings, synchronize_information, acknowledge_synchronization, finish_handshake);
      };
      loop();
    } else {
      me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('This worker has already joined.'));
    }
  });

  this._worker_module.on('me-update', (my_worker_new_interfaces_connect_settings, my_new_worker_detail, me_update_callback) => {
    if (!my_worker_new_interfaces_connect_settings) {
      my_worker_new_interfaces_connect_settings = null;
    }
    if (!my_new_worker_detail) {
      my_new_worker_detail = null;
    }

    const my_worker_new_interfaces_connect_settings_bytes = this._nsdt_embedded_protocol.encode(my_worker_new_interfaces_connect_settings);
    const my_new_worker_detail_bytes = this._nsdt_embedded_protocol.encode(my_new_worker_detail);

    const worker_affairs_worker_peer_update_broadcast_bytes = Buf.concat([
      Buf.encodeUInt32BE(this._my_worker_id),
      Buf.encodeUInt32BE(my_worker_new_interfaces_connect_settings_bytes.length),
      my_worker_new_interfaces_connect_settings_bytes,
      my_new_worker_detail_bytes
    ]);

    this._broadcastWorkerAffairsWorkerPeerOperation('update', this._my_worker_id, worker_affairs_worker_peer_update_broadcast_bytes, me_update_callback);
  });

  this._worker_module.on('me-leave', (me_leave_callback) => {
    const worker_affairs_worker_peer_leave_broadcast_bytes = Buf.concat([
      Buf.encodeUInt32BE(this._my_worker_id)
    ]);

    this._broadcastWorkerAffairsWorkerPeerOperation('leave', this._my_worker_id, worker_affairs_worker_peer_leave_broadcast_bytes, (error) => {
      if (error) {
        me_leave_callback(error);
      } else {
        me_leave_callback(error);
      }
    });
  });

  this._worker_module.on('worker-peer-leave', (target_worker_peer_worker_id, me_leave_callback) => {
    const worker_affairs_worker_peer_update_broadcast_bytes = Buf.concat([
      Buf.encodeUInt32BE(target_worker_peer_worker_id)
    ]);
    this._broadcastWorkerAffairsWorkerPeerOperation('leave', target_worker_peer_worker_id, worker_affairs_worker_peer_leave_broadcast_bytes, me_leave_callback);
  });

  this._worker_module.on('worker-peer-detail-get', (target_worker_peer_worker_id, callback) => {
    if (this._worker_peers_settings[target_worker_peer_worker_id]) {
      callback(false, this._worker_peers_settings[target_worker_peer_worker_id].detail);
    } else {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Does not exist worker peer with such worker id(' + target_worker_peer_worker_id + ').'));
    }
  });

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
 * @memberof module:WorkerProtocol
 * @param {buffer} synchronize_information
 * @return {buffer} synchronize_acknowledgement_information
 * @description Synchronize handshake from remote emitter.
 */
WorkerProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {
  // Synchronize information for handshake
  // Worker Affairs Protocol
  const protocol_code_int = synchronize_information[0];
  if (protocol_code_int === this._ProtocolCodes.worker_affairs[0]) {
    onError((error) => {
      // Server side error.
      // console.log(error);
    });

    if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond[0]) {
      // Corrupted settings.
      if (!this._static_global_random_seed_4096bytes || this._static_global_random_seed_4096bytes.length !== 4096) {
        next(Buf.concat([
          this._ProtocolCodes.worker_affairs,
          this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
          this._ProtocolCodes.unknown_reason_reject_2_bytes
        ]));
        this._worker_module.emitEventListener('error', new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected worker join due to static_global_random_seed_4096bytes settings wrongly set.'));
        return;
      }

      const new_worker_authentication_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(2, 6));
      const new_worker_authentication_data = this._nsdt_embedded_protocol.decode(synchronize_information.slice(6, 6 + new_worker_authentication_bytes_length));
      try {
        // Emit worker authentication from worker module.
        this._worker_module.emitEventListener('worker-peer-authentication', 0, new_worker_authentication_data, (is_authenticity_valid) => {
          if (is_authenticity_valid) {
            // Broadcast worker join.
            const bytes_offset_length = 6 + new_worker_authentication_bytes_length;
            const new_worker_peer_interfaces_connect_settings_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(bytes_offset_length, bytes_offset_length + 4));
            const new_worker_peer_interfaces_connect_settings = this._nsdt_embedded_protocol.decode(synchronize_information.slice(bytes_offset_length + 4, bytes_offset_length + 4 + new_worker_peer_interfaces_connect_settings_bytes_length));
            const new_worker_peer_detail = this._nsdt_embedded_protocol.decode(synchronize_information.slice(bytes_offset_length + 4 + new_worker_peer_interfaces_connect_settings_bytes_length));

            // Obtain new Id.
            const worker_ids_list = Object.keys(this._worker_peers_settings).map(x => parseInt(x));
            const max_worker_id = worker_ids_list[worker_ids_list.length - 1] + 1;
            let new_worker_id = 0;
            for (let id = 1; id <= max_worker_id; id++) {
              if (!worker_ids_list.includes(id)) {
                new_worker_id = id;
                break;
              }
            }

            const my_worker_authenticity_bytes = this._encodeAuthenticityBytes();

            const worker_affairs_worker_peer_join_broadcast_bytes = Buf.concat([
              Buf.encodeUInt32BE(new_worker_id),
              synchronize_information.slice(bytes_offset_length)
            ]);

            this._broadcastWorkerAffairsWorkerPeerOperation('join', new_worker_id, worker_affairs_worker_peer_join_broadcast_bytes, (error) => {
              if (error) {
                next(Buf.concat([
                  this._ProtocolCodes.worker_affairs,
                  this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
                  Buf.from([0x00, 0x02]) // Reject Broadcast error.
                ]));
              } else {
                let worker_peers_settings = {};
                // Generate clean new interfaces settings for new worker.
                for (const index in this._worker_peers_settings) {
                  worker_peers_settings[index] = {
                    interfaces_connect_settings: this._worker_peers_settings[index].interfaces_connect_settings,
                    detail: this._worker_peers_settings[index].detail
                  };
                }

                // New worker.
                worker_peers_settings[new_worker_id] = {};
                worker_peers_settings[new_worker_id].interfaces_connect_settings = new_worker_peer_interfaces_connect_settings;
                worker_peers_settings[new_worker_id].detail = new_worker_peer_detail;

                next(Buf.concat([
                  this._ProtocolCodes.worker_affairs,
                  this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
                  this._ProtocolCodes.accept, // Accept.
                  Buf.encodeUInt32BE(new_worker_id),
                  this._static_global_random_seed_4096bytes,
                  this._nsdt_embedded_protocol.encode(worker_peers_settings)
                ]));
              }
            });
          } else {
            next(Buf.concat([
              this._ProtocolCodes.worker_affairs,
              this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
              this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject Authenticication error.
            ]));
          }
        });
      } catch (error) {
        console.log(error);
        next(Buf.concat([
          this._ProtocolCodes.worker_affairs,
          this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
          this._ProtocolCodes.unknown_reason_reject_2_bytes
        ]));
      }
    } else if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_join_broadcast[0]) {
      this._handleWorkerAffairsWorkerPeerOperationBroadcast('join', synchronize_information, next);
    } else if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_update_broadcast[0]) {
      this._handleWorkerAffairsWorkerPeerOperationBroadcast('update', synchronize_information, next);
    } else if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_leave_broadcast[0]) {
      this._handleWorkerAffairsWorkerPeerOperationBroadcast('leave', synchronize_information, next);
    } else if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_comfirm_broadcast[0]) {
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(synchronize_information.slice(2, 6));
      const remote_worker_peer_authenticity_bytes = synchronize_information.slice(6);

      this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
        // Validate authentication first.
        if (is_authenticity_valid) {
          const new_settings = this._worker_peers_settings[target_worker_peer_worker_id].new_settings;
          if (new_settings === null) {
            delete this._worker_peers_settings[target_worker_peer_worker_id];
          } else {
            this._worker_peers_settings[target_worker_peer_worker_id] = new_settings;
            // Recalculate checksum.
            this._updateWorkerPeersIdsChecksum4Bytes(Object.keys(this._worker_peers_settings));
            this._setWorkerPeerWorkerAffairUnLocked(target_worker_peer_worker_id);
          }
          next(Buf.concat([
            this._ProtocolCodes.worker_affairs,
            this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
            this._ProtocolCodes.accept
          ]));
        } else {
          // Send reject to master.
          next(Buf.concat([
            this._ProtocolCodes.worker_affairs,
            this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
            this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
          ]));
        }
      });
    } else if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast[0]) {
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(synchronize_information.slice(2, 6));
      const remote_worker_peer_authenticity_bytes = synchronize_information.slice(6);
      this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
        if (is_authenticity_valid) {
          const next_of_cancel = (error) => {
            if (error) {
              // Send reject to master.
              next(Buf.concat([
                this._ProtocolCodes.worker_affairs,
                this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
                this._ProtocolCodes.unknown_reason_reject_2_bytes
              ]));
            } else {
              // Send accept to master.
              next(Buf.concat([
                this._ProtocolCodes.worker_affairs,
                this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
                this._ProtocolCodes.accept
              ]));
            }
          };
          this._worker_peers_settings[target_worker_peer_worker_id].on_worker_affairs_worker_peer_operation_cancel(next_of_cancel);
          delete this._worker_peers_settings[target_worker_peer_worker_id]['on_worker_affairs_worker_peer_operation_cancel'];
          this._setWorkerPeerWorkerAffairUnLocked(target_worker_peer_worker_id);
        } else {
          // Send reject to master.
          next(Buf.concat([
            this._ProtocolCodes.worker_affairs,
            this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
            this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
          ]));
        }
      });
    } else next(false);


    // Worker Object Protocols
  } else if (protocol_code_int === this._ProtocolCodes.worker_object[0]) {
    // Below codes are mainly related to prefix proccessing of worker object protocols.
    const worker_object_protocol_code_1byte = Buf.from([synchronize_information[1]]);
    const worker_subprotocol_protocol_code_1byte = Buf.from([synchronize_information[2]]);
    const sliced_synchronize_information = synchronize_information.slice(3);
    const worker_subprotocol_module = this._worker_object_protocol_with_worker_subprotocol_modules_dict[worker_object_protocol_code_1byte[0]][worker_subprotocol_protocol_code_1byte[0]];

    let error_listener;

    const decorated_on_acknowledge = (callback) => {
      onAcknowledge((acknowledge_information, tunnel) => {
        if (
          acknowledge_information[0] === this._ProtocolCodes.worker_object[0] &&
          acknowledge_information[1] === worker_object_protocol_code_1byte[0] &&
          acknowledge_information[2] === worker_subprotocol_protocol_code_1byte[0]
        ) {
          callback(acknowledge_information.slice(3), tunnel);
        } else {
          error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), tunnel);
          tunnel.close();
        }
      });
    };

    const decorated_next = (data_bytes) => {
      next(Buf.concat([
        this._ProtocolCodes.worker_object,
        worker_object_protocol_code_1byte,
        worker_subprotocol_protocol_code_1byte,
        data_bytes
      ]));
    };

    const decorated_on_error = (listener) => {
      error_listener = listener;
      onError(error_listener);
    };

    worker_subprotocol_module.synchronize(sliced_synchronize_information, onError, decorated_on_acknowledge, decorated_next);
  } else {
    next(false);
  };
}

module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

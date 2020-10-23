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

const GlobalDeterministicRandomManager = require('./global_deterministic_random_manager');
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
  this._synchronize_function = settings.synchronize;

  /**
   * @memberof module:WorkerProtocol
   * @type {integer}
   * @private
   * @description WorkerId.
   */
  this._my_worker_id = 0;

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
   * @description GlobalDeterministicRandomManager.
   */
  this._global_deterministic_random_manager;

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
  this._worker_peers_worker_ids_checksum_4bytes;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description Dictionary from worker id to interfaces and details.
   */
  this._worker_peer_settings_dict = {};

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

  const a_worker_response_listener = (worker_id, error, response_data_bytes, next_of_a_worker_response_listener) => {
    if (error) {
      next_of_a_worker_response_listener(error, false);
    } else if (response_data_bytes[0] === this._ProtocolCodes.worker_affairs[0] && response_data_bytes[1] === worker_peer_opreation_byte[0]) {
      if (response_data_bytes[2] === this._ProtocolCodes.accept[0]) {
        next_of_a_worker_response_listener(error, true);
      } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
        // [Flag]
        next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);
      } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
        // [Flag]
        next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);
      } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), Buf.from([0x00, 0x02]))) {
        // [Flag]
        next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker affairs operation collision error.'), false);
      } else {
        // [Flag]
        next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
      }
    }
  };

  const finished_listener = (error, finished_worker_id_list) => {
    const encoded_authenticity_bytes = this._encodeAuthenticityBytes();
    if (error) {
      // Cancel all operation done.
      const worker_affairs_worker_peer_operation_cancel_broadcast_bytes = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
        Buf.encodeUInt32BE(target_worker_peer_worker_id),
        encoded_authenticity_bytes
      ]);

      const a_worker_response_listener = (worker_id, error, response_data_bytes, next_of_a_worker_response_listener) => {
        if (response_data_bytes[0] === this._ProtocolCodes.worker_affairs[0] && response_data_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast[0]) {
          if (response_data_bytes[2] === this._ProtocolCodes.accept[0]) {
            next_of_a_worker_response_listener(false, true);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);

          } else {
            next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
          }
        } else {
          next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
        }
      };

      const inner_finished_listener = (error, inner_finished_worker_id_list) => {
        if (error) {
          console.log(error, inner_finished_worker_id_list);
        }
      };
      this._multicastRequest(finished_worker_id_list, worker_affairs_worker_peer_operation_cancel_broadcast_bytes, a_worker_response_listener, inner_finished_listener);
    } else {
      // Comfirm all operation done.
      const worker_affairs_worker_peer_join_comfirm_broadcast_bytes = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_peer_operation_comfirm_broadcast,
        Buf.encodeUInt32BE(target_worker_peer_worker_id),
        encoded_authenticity_bytes
      ]);

      const a_worker_response_listener = (worker_id, error, response_data_bytes, next_of_a_worker_response_listener) => {
        if (response_data_bytes[0] === this._ProtocolCodes.worker_affairs[0] && response_data_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast[0]) {
          if (response_data_bytes[2] === this._ProtocolCodes.accept[0]) {
            next_of_a_worker_response_listener(false, true);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);

          } else {
            next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
          }
        } else {
          next_of_a_worker_response_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
        }
      };

      const inner_finished_listener = (error, inner_finished_worker_id_list) => {
        if (error) {
          console.log(error, inner_finished_worker_id_list);
        }
        if (operation_type === 'leave') {
          // Reset worker.
          this._my_worker_id = 0;
          this._my_worker_id_4bytes = null;
          this._my_worker_id_4bytes = null;
          this._my_worker_authenticity_data_bytes = null;
          this._worker_peers_worker_ids_checksum_4bytes = null;
          this._worker_peer_settings_dict = {};
        }
      };

      this._multicastRequest(finished_worker_id_list, worker_affairs_worker_peer_join_comfirm_broadcast_bytes, a_worker_response_listener, inner_finished_listener);
    }
    callback(error);
  };

  this._broadcastRequestToAllWorkers(worker_affairs_worker_peer_join_broadcast_bytes, a_worker_response_listener, finished_listener);
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._handleWorkerAffairsWorkerPeerOperationBroadcast = function(operation_type, synchronize_message_bytes, next) {
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

  const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(2, 6));
  const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(6, 6 + remote_worker_peer_authenticity_bytes_length);
  this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
    if ((operation_type === 'update' || operation_type === 'leave') && !Object.keys(this._worker_peer_settings_dict).includes(remote_worker_peer_worker_id + '')) {
      next(Buf.concat([
        this._ProtocolCodes.worker_affairs,
        worker_peer_opreation_byte,
        this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
      ]));
    } else if (is_authenticity_valid) {
      const bytes_offseted = synchronize_message_bytes.slice(6 + remote_worker_peer_authenticity_bytes_length);
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(bytes_offseted.slice(0, 4));
      const new_worker_peer_connectors_settings_bytes_length = (operation_type === 'leave') ? null : Buf.decodeUInt32BE(bytes_offseted.slice(4, 8));
      let new_worker_peer_connectors_settings = (operation_type === 'leave') ? null : this._nsdt_embedded_protocol.decode(bytes_offseted.slice(8, 8 + new_worker_peer_connectors_settings_bytes_length));
      let new_worker_peer_detail = (operation_type === 'leave') ? null : this._nsdt_embedded_protocol.decode(bytes_offseted.slice(8 + new_worker_peer_connectors_settings_bytes_length));

      // [Flag] Test
      // if (this._my_worker_id === 2) {
      //   this._worker_peer_settings_dict[3] = {};
      //   this._worker_peer_settings_dict[3]['worker_affairs_locked'] = true;
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
          this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings = null;
        } else if (operation_type === 'join') {
          this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings = {
            connectors_settings: new_worker_peer_connectors_settings,
            detail: new_worker_peer_detail
          };
        } else if (operation_type === 'update') {
          // If null preserve settings.
          if (!new_worker_peer_connectors_settings) {
            new_worker_peer_connectors_settings = this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings;
          }
          if (!new_worker_peer_detail) {
            new_worker_peer_detail = this._worker_peer_settings_dict[target_worker_peer_worker_id].detail;
          }
          this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings = {
            connectors_settings: new_worker_peer_connectors_settings,
            detail: new_worker_peer_detail
          };
        }

        const next_of_worker_module = (error, on_cancel) => {
          this._worker_peer_settings_dict[target_worker_peer_worker_id].on_worker_affairs_worker_peer_operation_cancel = on_cancel;
          if (error) {
            next(Buf.concat([
              this._ProtocolCodes.worker_affairs,
              worker_peer_opreation_byte,
              this._ProtocolCodes.unknown_reason_reject_2_bytes // Reject. Authenticication error.
            ]));
          } else {
            // this._worker_peer_settings_dict[target_worker_peer_worker_id] = {
            //   interfaces: new_worker_peer_connectors_settings,
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
          this._worker_module.emitEventListener(event_listener_name, target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, next_of_worker_module);
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
WorkerProtocol.prototype._updateWorkerPeersIdsChecksum4Bytes = function(peers_worker_id_list) {
  let worker_peers_worker_ids_checksum = 0;
  for (const index in peers_worker_id_list) {
    peers_worker_id_list[index] = parseInt(peers_worker_id_list[index]);
    worker_peers_worker_ids_checksum += peers_worker_id_list[index];
  }
  const worker_peers_worker_ids_checksum_bytes = Buf.encodeUInt32BE(worker_peers_worker_ids_checksum);
  this._worker_peers_worker_ids_checksum_4bytes = worker_peers_worker_ids_checksum_bytes;
  return worker_peers_worker_ids_checksum_bytes;
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._synchronizeWorkerPeerByWorkerId = function(
  target_worker_peer_worker_id, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler) {
  if (!this._worker_peer_settings_dict[target_worker_peer_worker_id]) {
    synchronize_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Does not exist worker peer with such worker(id: ' + target_worker_peer_worker_id + ').'));
    return;
  }
  const connectors_settings = this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings;

  let index = 0;
  const synchronize_error_list = [];
  const loop_next = () => {
    index++;
    if (index < connectors_settings.length) {
      loop();
    }
    // No more next loop. Exit.
    else {
      synchronize_error_handler(synchronize_error_list);
    }
  };

  const loop = () => {
    const interface_name = connectors_settings[index].interface_name;
    const connector_settings = connectors_settings[index].connector_settings;

    // "_" is for distincting the one from parameters.
    const _synchronize_error_handler = (synchronize_error) => {
      // Unable to open handshake. Next loop.
      synchronize_error_list.push(synchronize_error);
      loop_next();

      // Return acknowledge_message_bytes(not acknowledge).
      next(false);
    };

    // "_" is for distincting the one from parameters.
    const _synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
      // synchronize_acknowledgment_handler obtained from parameters.
      synchronize_acknowledgment_handler(synchronize_acknowledgment_message_bytes, acknowledge);
    };

    // Callbacks setup completed. Start handshake process.
    this._synchronize_function(interface_name, connector_settings, synchronize_message_bytes, _synchronize_error_handler, _synchronize_acknowledgment_handler);
  };

  loop();
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._multicastRequest = function(worker_id_list, data_bytes, a_worker_response_listener, finished_listener) {

  // Broadcast worker join start.
  // max concurrent connections.
  const max_concurrent_connections_count = MAX_CONCURRENT_CONNECTIONS_COUNT;
  const finished_worker_id_list = [];
  let escape_loop_with_error = false;
  let worker_peers_errors = {};
  let current_connections_count = 0;
  let index = 0;
  // let errors = {};

  const loop_over_workers = () => {
    const worker_id = parseInt(worker_id_list[index]);
    if (worker_id) {
      current_connections_count++;

      // Concurrently open connections.
      if (current_connections_count < max_concurrent_connections_count) {
        loop_next();
      }

      const called_a_worker_response_listener = (synchronize_error, synchronize_acknowledgment_message_bytes)=> {
        a_worker_response_listener(worker_id, synchronize_error, synchronize_acknowledgment_message_bytes, (error, is_finished) => {
          if (error) {
            worker_peers_errors[worker_id] = error;
            escape_loop_with_error = true;
          }
          if (is_finished) {
            finished_worker_id_list.push(worker_id);
          }
          current_connections_count--;
          loop_next();
        });
      };

      // Check worker id is not 0.
      if (worker_id !== 0) {
        const synchronize_error_handler = (synchronize_error) => {
          called_a_worker_response_listener(synchronize_error, null);
        };

        const synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
          called_a_worker_response_listener(false, synchronize_acknowledgment_message_bytes);
          // Not suppose acknowledge.
          // Request, response only have 2 progress instead of 3 full handshake.
          acknowledge(false);
        };

        this._synchronizeWorkerPeerByWorkerId(worker_id, data_bytes, synchronize_error_handler, synchronize_acknowledgment_handler);
      } else {
        loop_next();
      }
    } else {
      loop_next();
    }
  };

  const loop_next = () => {
    index++;
    if (finished_worker_id_list.length >= worker_id_list.length) {
      finished_listener(false, finished_worker_id_list);
    } else if (escape_loop_with_error && current_connections_count === 0) {
      finished_listener(worker_peers_errors, finished_worker_id_list);
    } else if (index < worker_id_list.length && current_connections_count < max_concurrent_connections_count) {
      loop_over_workers();
    }
  };

  loop_over_workers();
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._broadcastRequestToAllWorkers = function(data_bytes, a_worker_response_listener, finished_listener) {
  const worker_id_list = Object.keys(this._worker_peer_settings_dict).map(x => parseInt(x));
  this._multicastRequest(worker_id_list, data_bytes, a_worker_response_listener, finished_listener);
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._encodeAuthenticityBytes = function() {
  return Buf.concat([
    this._my_worker_id_4bytes,
    this._worker_peers_worker_ids_checksum_4bytes,
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
  const remote_worker_peers_worker_ids_checksum_4bytes = remote_authenticity_bytes.slice(4, 8);
  const remote_worker_peers_static_global_random_seed_checksum_4bytes = remote_authenticity_bytes.slice(8, 12);
  let remote_worker_peer_authenticity_data;

  try {
    remote_worker_peer_authenticity_data = this._nsdt_embedded_protocol.decode(remote_authenticity_bytes.slice(12));
  } catch (error) {
    callback(error, false, remote_worker_peer_worker_id);
    return;
  }

  // Check worker_peers_worker_ids_checksum_4bytes.
  if (Utils.areBuffersEqual(this._worker_peers_worker_ids_checksum_4bytes, remote_worker_peers_worker_ids_checksum_4bytes) &&
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
  const worker_peer_settings = this._worker_peer_settings_dict[worker_id];
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
  if (this._worker_peer_settings_dict[worker_id]) {
    this._worker_peer_settings_dict[worker_id].worker_affairs_locked = locked_by_worker_peer_with_worker_id;
  } else {
    this._worker_peer_settings_dict[worker_id] = {};
    this._worker_peer_settings_dict[worker_id].worker_affairs_locked = locked_by_worker_peer_with_worker_id;
  }
}

/**
 * @memberof module:WorkerProtocol
 * @private
 */
WorkerProtocol.prototype._setWorkerPeerWorkerAffairUnLocked = function(worker_id) {
  if (!this._worker_peer_settings_dict[worker_id].connectors_settings) {
    delete this._worker_peer_settings_dict[worker_id];
  } else if (this._worker_peer_settings_dict[worker_id]) {
    this._worker_peer_settings_dict[worker_id].worker_affairs_locked = false;
  } else {
    this._worker_peer_settings_dict[worker_id] = {};
    this._worker_peer_settings_dict[worker_id].worker_affairs_locked = false;
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
        synchronizeWorkerPeerByWorkerId: (target_worker_peer_worker_id, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler) => {
          const decorated_synchronize_message_bytes = Buf.concat([prefix_data_bytes, synchronize_message_bytes]);
          const decorated_synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
            const decorated_acknowledge = (data_bytes, acknowledge_callback) => {
              if(Buf.isBuffer(data_bytes)) {
                acknowledge(Buf.concat([prefix_data_bytes, data_bytes]), acknowledge_callback);
              }
              else {
                acknowledge(false);
              }
            }
            if(
              synchronize_acknowledgment_message_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              synchronize_acknowledgment_message_bytes[1] === worker_object_protocol_code_1byte[0] &&
              synchronize_acknowledgment_message_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              synchronize_acknowledgment_handler(synchronize_acknowledgment_message_bytes.slice(3), decorated_acknowledge);
            } else {
              acknowledge(false);
              synchronize_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'));
            }
          };
          this._synchronizeWorkerPeerByWorkerId(target_worker_peer_worker_id, decorated_synchronize_message_bytes, synchronize_error_handler, decorated_synchronize_acknowledgment_handler);
        },
        multicastRequest: (worker_id_list, data_bytes, a_worker_response_listener, finished_listener) => {
          const decorated_data_bytes = Buf.concat([prefix_data_bytes, data_bytes]);
          const decorated_a_worker_response_listener = (worker_id, error, response_data_bytes, next) => {
            if(error) {
              a_worker_response_listener(worker_id, error, null, next);
            }
            else if(
              response_data_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              response_data_bytes[1] === worker_object_protocol_code_1byte[0] &&
              response_data_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              a_worker_response_listener(worker_id, error, response_data_bytes.slice(3), next);
            } else {
              a_worker_response_listener(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_data_bytes.slice(3), next);
            }
          };
          this._multicastRequest(worker_id_list, decorated_data_bytes, decorated_a_worker_response_listener, finished_listener);
        },
        broadcastRequestToAllWorkers: (data_bytes, a_worker_response_listener, finished_listener) => {
          const decorated_data_bytes = Buf.concat([prefix_data_bytes, data_bytes]);
          const decorated_a_worker_response_listener = (worker_id, error, response_data_bytes, next) => {
            if(error) {
              a_worker_response_listener(worker_id, error, null, next);
            }
            else if(
              response_data_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              response_data_bytes[1] === worker_object_protocol_code_1byte[0] &&
              response_data_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              a_worker_response_listener(worker_id, error, response_data_bytes.slice(3), next);
            } else {
              a_worker_response_listener(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_data_bytes.slice(3), next);
            }
          };
          this._multicastRequest(worker_id_list, decorated_data_bytes, decorated_a_worker_response_listener, finished_listener);
        },
      },
      return_my_worker_id: () => {
        return this._my_worker_id;
      },
      hash_manager: this._hash_manager,
      nsdt_embedded_protocol: this._nsdt_embedded_protocol,
      worker_global_protocol_codes: this._ProtocolCodes,
      static_global_random_seed_4096bytes: this._static_global_random_seed_4096bytes, // Critical for solving conflicts or without-communication consensus.
      global_deterministic_random_manager: {
        generateIntegerInRange: (initialization_vector_bytes, begin_int, end_int, callback) => {
          this._global_deterministic_random_manager.generateIntegerInRange(initialization_vector_bytes, begin_int, end_int, callback);
        },
        generateIntegerListInRange: (initialization_vector_bytes, begin_int, end_int, list_length, callback) => {
          this._global_deterministic_random_manager.generateIntegerListInRange(initialization_vector_bytes, begin_int, end_int, list_length, callback);
        }
      }
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
      this._global_deterministic_random_manager = new GlobalDeterministicRandomManager({
        static_global_random_seed_4096bytes: static_global_random_seed_4096bytes
      });
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

  this._worker_module.on('worker-peers-settings-import', (worker_peer_settings_dict, callback) => {
    if (this._my_worker_id === 0) {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('You have to import authenticity data first.'));
      return;
    }

    // Check the validability of imported worker_peer_settings_dict.
    const required_fields = ['connectors_settings', 'detail'];
    let worker_peers_worker_ids_checksum = 0;
    let include_myself = false;
    // Loop over all workers.
    for (const index in worker_peer_settings_dict) {

      // Obtain keys from specified worker.
      const keys = Object.keys(worker_peer_settings_dict[index]);
      const worker_id = parseInt(index);
      worker_peers_worker_ids_checksum += worker_id;
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
        worker_peer_settings_dict[index]['worker_affairs_locked'] = false;
      }
    }

    if (!include_myself) {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported worker peers settings must include myself.'));
      return;
    }
    this._worker_peer_settings_dict = worker_peer_settings_dict;

    this._worker_peers_worker_ids_checksum_4bytes = Buf.encodeUInt32BE(worker_peers_worker_ids_checksum);
    // Peacefully finish the job.
    callback(false);
  });

  this._worker_module.on('me-join', (remote_worker_connectors_settings, my_worker_connectors_settings, my_worker_detail, my_worker_authentication_data, me_join_callback) => {
    if (this._my_worker_id === 0) {
      // [Flag] Check field.
      // Shuffle for clientwise loadbalancing.
      const shuffled_connectors_settings_list = Utils.shuffleArray(remote_worker_connectors_settings);

      const my_worker_authentication_data_bytes = this._nsdt_embedded_protocol.encode(my_worker_authentication_data);
      const my_worker_connectors_settings_bytes = this._nsdt_embedded_protocol.encode(my_worker_connectors_settings);
      const my_worker_detail_bytes = this._nsdt_embedded_protocol.encode(my_worker_detail);

      const synchronize_message_bytes = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
        Buf.encodeUInt32BE(my_worker_authentication_data_bytes.length),
        my_worker_authentication_data_bytes,
        Buf.encodeUInt32BE(my_worker_connectors_settings_bytes.length),
        my_worker_connectors_settings_bytes,
        my_worker_detail_bytes
      ]);

      // Proceed tunnel creations loop.
      let index = 0;
      // Loop loop() with condition.
      const loop_next = () => {
        index++;
        if (index < shuffled_connectors_settings_list.length) {
          loop();
        }
        // No more next loop. Exit.
        else {
          me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Could not create handshakes via imported interfaces.'));
        }
      };

      const loop = () => {
        const interface_name = shuffled_connectors_settings_list[index].interface_name;
        const connector_settings = shuffled_connectors_settings_list[index].connector_settings;

        const synchronize_error_handler = (synchronize_error) => {
          loop_next();
        };

        const synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
          // Handshake opened. Check if synchronize_acknowledgment_message_bytes valid.
          if (synchronize_acknowledgment_message_bytes[0] === this._ProtocolCodes.worker_affairs[0] && synchronize_acknowledgment_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond[0]) {
            // Acknowledgement information for handshake
            // const acknowledge_message_bytes = this._ProtocolCodes.worker_affairs;
            if (synchronize_acknowledgment_message_bytes[2] === this._ProtocolCodes.accept[0]) {
              // Accept.
              const new_worker_id = Buf.decodeUInt32BE(synchronize_acknowledgment_message_bytes.slice(3, 7));
              const static_global_random_seed_4096bytes = synchronize_acknowledgment_message_bytes.slice(7, 7 + 4096);
              const worker_peer_settings_dict = this._nsdt_embedded_protocol.decode(synchronize_acknowledgment_message_bytes.slice(7 + 4096));

              // Update worker peers settings
              this._worker_peer_settings_dict = worker_peer_settings_dict;
              this._static_global_random_seed_4096bytes = static_global_random_seed_4096bytes;
              this._global_deterministic_random_manager = new GlobalDeterministicRandomManager({
                static_global_random_seed_4096bytes: static_global_random_seed_4096bytes
              });
              this._static_global_random_seed_checksum_4bytes = Utils.hash4BytesMd5(static_global_random_seed_4096bytes);
              this._updateWorkerPeersIdsChecksum4Bytes(Object.keys(worker_peer_settings_dict));

              acknowledge(false);
              me_join_callback(false, new_worker_id, worker_peer_settings_dict, static_global_random_seed_4096bytes);
            } else if (Utils.areBuffersEqual(synchronize_acknowledgment_message_bytes.slice(2, 4), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
              acknowledge(false);
              me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'));
            } else if (Utils.areBuffersEqual(synchronize_acknowledgment_message_bytes.slice(2, 4), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
              acknowledge(false);
              me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'));
            } else if (Utils.areBuffersEqual(synchronize_acknowledgment_message_bytes.slice(2, 4), Buf.from([0x00, 0x02]))) {
              acknowledge(false);
              me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Broadcast error'));
            } else {
              acknowledge(false);
              me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown error'));
            }
            // Return acknowledge binary.
          } else {
            loop_next();
          }
        };

        // Callbacks setup completed. Start handshake process (actually request response here).
        this._synchronize_function(interface_name, connector_settings, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler);
      };
      loop();
    } else {
      me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('This worker has already joined.'));
    }
  });

  this._worker_module.on('me-update', (my_worker_new_connectors_settings, my_new_worker_detail, me_update_callback) => {
    if(this._my_worker_id === 0) {
      me_update_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('You have\'t join yourself yet.'));
      return;
    }
    if (!my_worker_new_connectors_settings) {
      my_worker_new_connectors_settings = null;
    }
    if (!my_new_worker_detail) {
      my_new_worker_detail = null;
    }

    const my_worker_new_connectors_settings_bytes = this._nsdt_embedded_protocol.encode(my_worker_new_connectors_settings);
    const my_new_worker_detail_bytes = this._nsdt_embedded_protocol.encode(my_new_worker_detail);

    const worker_affairs_worker_peer_update_broadcast_bytes = Buf.concat([
      Buf.encodeUInt32BE(this._my_worker_id),
      Buf.encodeUInt32BE(my_worker_new_connectors_settings_bytes.length),
      my_worker_new_connectors_settings_bytes,
      my_new_worker_detail_bytes
    ]);

    this._broadcastWorkerAffairsWorkerPeerOperation('update', this._my_worker_id, worker_affairs_worker_peer_update_broadcast_bytes, me_update_callback);
  });

  this._worker_module.on('me-leave', (me_leave_callback) => {
    if(this._my_worker_id === 0) {
      me_leave_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('You have\'t join yourself yet.'));
      return;
    }

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
    if (this._worker_peer_settings_dict[target_worker_peer_worker_id]) {
      callback(false, this._worker_peer_settings_dict[target_worker_peer_worker_id].detail);
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
 * @callback module:WorkerProtocol~callback_of_synchronize_acknowledgment
 * @param {buffer} synchronize_returned_data
 */
/**
 * @memberof module:WorkerProtocol
 * @param {buffer} synchronize_message_bytes
 * @param {function} handle_synchronize_acknowledgment_error
 * @param {function} handle_acknowledge
 * @param {module:WorkerProtocol~callback_of_synchronize_acknowledgment} synchronize_acknowledgment
 * @description Synchronize handshake from remote emitter.
 */
WorkerProtocol.prototype.SynchronizeListener = function(synchronize_message_bytes, synchronize_acknowledgment, handle_synchronize_acknowledgment_error, handle_acknowledge) {
  // Synchronize information for handshake
  // Worker Affairs Protocol
  const protocol_code_int = synchronize_message_bytes[0];
  if (protocol_code_int === this._ProtocolCodes.worker_affairs[0]) {
    handle_synchronize_acknowledgment_error((error) => {
      // Server side error.
      // console.log(error);
    });

    if (synchronize_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond[0]) {
      // Corrupted settings.
      if (!this._static_global_random_seed_4096bytes || this._static_global_random_seed_4096bytes.length !== 4096) {
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_affairs,
          this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
          this._ProtocolCodes.unknown_reason_reject_2_bytes
        ]));
        this._worker_module.emitEventListener('error', new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected worker join due to static_global_random_seed_4096bytes settings wrongly set.'));
        return;
      }

      const new_worker_authentication_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(2, 6));
      const new_worker_authentication_data = this._nsdt_embedded_protocol.decode(synchronize_message_bytes.slice(6, 6 + new_worker_authentication_bytes_length));
      try {
        // Emit worker authentication from worker module.
        this._worker_module.emitEventListener('worker-peer-authentication', 0, new_worker_authentication_data, (is_authenticity_valid) => {
          if (is_authenticity_valid) {
            // Broadcast worker join.
            const bytes_offset_length = 6 + new_worker_authentication_bytes_length;
            const new_worker_peer_connectors_settings_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(bytes_offset_length, bytes_offset_length + 4));
            const new_worker_peer_connectors_settings = this._nsdt_embedded_protocol.decode(synchronize_message_bytes.slice(bytes_offset_length + 4, bytes_offset_length + 4 + new_worker_peer_connectors_settings_bytes_length));
            const new_worker_peer_detail = this._nsdt_embedded_protocol.decode(synchronize_message_bytes.slice(bytes_offset_length + 4 + new_worker_peer_connectors_settings_bytes_length));

            // Obtain new Id.
            const worker_id_list = Object.keys(this._worker_peer_settings_dict).map(x => parseInt(x));
            const max_worker_id = worker_id_list[worker_id_list.length - 1] + 1;
            let new_worker_id = 0;
            for (let id = 1; id <= max_worker_id; id++) {
              if (!worker_id_list.includes(id)) {
                new_worker_id = id;
                break;
              }
            }

            const my_worker_authenticity_bytes = this._encodeAuthenticityBytes();

            const worker_affairs_worker_peer_join_broadcast_bytes = Buf.concat([
              Buf.encodeUInt32BE(new_worker_id),
              synchronize_message_bytes.slice(bytes_offset_length)
            ]);

            this._broadcastWorkerAffairsWorkerPeerOperation('join', new_worker_id, worker_affairs_worker_peer_join_broadcast_bytes, (error) => {
              if (error) {
                synchronize_acknowledgment(Buf.concat([
                  this._ProtocolCodes.worker_affairs,
                  this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
                  Buf.from([0x00, 0x02]) // Reject Broadcast error.
                ]));
              } else {
                let worker_peer_settings_dict = {};
                // Generate clean new interfaces settings for new worker.
                for (const index in this._worker_peer_settings_dict) {
                  worker_peer_settings_dict[index] = {
                    connectors_settings: this._worker_peer_settings_dict[index].connectors_settings,
                    detail: this._worker_peer_settings_dict[index].detail
                  };
                }

                // New worker.
                worker_peer_settings_dict[new_worker_id] = {};
                worker_peer_settings_dict[new_worker_id].connectors_settings = new_worker_peer_connectors_settings;
                worker_peer_settings_dict[new_worker_id].detail = new_worker_peer_detail;

                synchronize_acknowledgment(Buf.concat([
                  this._ProtocolCodes.worker_affairs,
                  this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
                  this._ProtocolCodes.accept, // Accept.
                  Buf.encodeUInt32BE(new_worker_id),
                  this._static_global_random_seed_4096bytes,
                  this._nsdt_embedded_protocol.encode(worker_peer_settings_dict)
                ]));
              }
            });
          } else {
            synchronize_acknowledgment(Buf.concat([
              this._ProtocolCodes.worker_affairs,
              this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
              this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject Authenticication error.
            ]));
          }
        });
      } catch (error) {
        console.log(error);
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_affairs,
          this._ProtocolCodes.worker_affairs_worker_peer_join_request_respond,
          this._ProtocolCodes.unknown_reason_reject_2_bytes
        ]));
      }
    } else if (synchronize_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_join_broadcast[0]) {
      this._handleWorkerAffairsWorkerPeerOperationBroadcast('join', synchronize_message_bytes, synchronize_acknowledgment);
    } else if (synchronize_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_update_broadcast[0]) {
      this._handleWorkerAffairsWorkerPeerOperationBroadcast('update', synchronize_message_bytes, synchronize_acknowledgment);
    } else if (synchronize_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_leave_broadcast[0]) {
      this._handleWorkerAffairsWorkerPeerOperationBroadcast('leave', synchronize_message_bytes, synchronize_acknowledgment);
    } else if (synchronize_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_comfirm_broadcast[0]) {
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(synchronize_message_bytes.slice(2, 6));
      const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(6);

      this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
        // Validate authentication first.
        if (is_authenticity_valid) {
          const new_settings = this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings;
          if (new_settings === null) {
            delete this._worker_peer_settings_dict[target_worker_peer_worker_id];
          } else {
            this._worker_peer_settings_dict[target_worker_peer_worker_id] = new_settings;
            // Recalculate checksum.
            this._updateWorkerPeersIdsChecksum4Bytes(Object.keys(this._worker_peer_settings_dict));
            this._setWorkerPeerWorkerAffairUnLocked(target_worker_peer_worker_id);
          }
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.worker_affairs,
            this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
            this._ProtocolCodes.accept
          ]));
        } else {
          // Send reject to master.
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.worker_affairs,
            this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
            this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
          ]));
        }
      });
    } else if (synchronize_message_bytes[1] === this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast[0]) {
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(synchronize_message_bytes.slice(2, 6));
      const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(6);
      this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
        if (is_authenticity_valid) {
          const synchronize_acknowledgment_of_cancel = (error) => {
            if (error) {
              // Send reject to master.
              synchronize_acknowledgment(Buf.concat([
                this._ProtocolCodes.worker_affairs,
                this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
                this._ProtocolCodes.unknown_reason_reject_2_bytes
              ]));
            } else {
              // Send accept to master.
              synchronize_acknowledgment(Buf.concat([
                this._ProtocolCodes.worker_affairs,
                this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
                this._ProtocolCodes.accept
              ]));
            }
          };
          this._worker_peer_settings_dict[target_worker_peer_worker_id].on_worker_affairs_worker_peer_operation_cancel(synchronize_acknowledgment_of_cancel);
          delete this._worker_peer_settings_dict[target_worker_peer_worker_id]['on_worker_affairs_worker_peer_operation_cancel'];
          this._setWorkerPeerWorkerAffairUnLocked(target_worker_peer_worker_id);
        } else {
          // Send reject to master.
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.worker_affairs,
            this._ProtocolCodes.worker_affairs_worker_peer_operation_cancel_broadcast,
            this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
          ]));
        }
      });
    } else synchronize_acknowledgment(false);


    // Worker Object Protocols
  } else if (protocol_code_int === this._ProtocolCodes.worker_object[0]) {
    // Below codes are mainly related to prefix proccessing of worker object protocols.
    const worker_object_protocol_code_1byte = Buf.from([synchronize_message_bytes[1]]);
    const worker_subprotocol_protocol_code_1byte = Buf.from([synchronize_message_bytes[2]]);
    const sliced_synchronize_message_bytes = synchronize_message_bytes.slice(3);
    const worker_subprotocol_module = this._worker_object_protocol_with_worker_subprotocol_modules_dict[worker_object_protocol_code_1byte[0]][worker_subprotocol_protocol_code_1byte[0]];

    let error_listener;

    const decorated_handle_acknowledge = (callback) => {
      handle_acknowledge((acknowledge_message_bytes, tunnel) => {
        if (
          acknowledge_message_bytes[0] === this._ProtocolCodes.worker_object[0] &&
          acknowledge_message_bytes[1] === worker_object_protocol_code_1byte[0] &&
          acknowledge_message_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
        ) {
          callback(acknowledge_message_bytes.slice(3), tunnel);
        } else {
          error_listener(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), tunnel);
          tunnel.close();
        }
      });
    };

    const decorated_synchronize_acknowledgment = (data_bytes) => {
      if(Buf.isBuffer(data_bytes)) {
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_object,
          worker_object_protocol_code_1byte,
          worker_subprotocol_protocol_code_1byte,
          data_bytes
        ]));
      }
      else {
        synchronize_acknowledgment(false);
      }
    };

    const decorated_on_error = (listener) => {
      error_listener = listener;
      handle_synchronize_acknowledgment_error(error_listener);
    };

    worker_subprotocol_module.SynchronizeListener(sliced_synchronize_message_bytes, decorated_synchronize_acknowledgment, handle_synchronize_acknowledgment_error, decorated_handle_acknowledge);
  } else {
    synchronize_acknowledgment(false);
  };
}

module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

/**
 * @file NoXerveAgent worker affair protocol file. [worker_affair_protocol.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerAffairProtocol
 */


const GlobalDeterministicRandomManager = require('./global_deterministic_random_manager');
const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');

/**
 * WorkerAffair Object.
 * @constructor module:WorkerAffairProtocol
 * @param {object} settings
 */
function WorkerAffairProtocol(settings) {
  /**
   * @memberof module:WorkerAffairProtocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {object}
   * @private
   * @description Open a handshake.
   */
  this._synchronize_function = settings.synchronize_function;

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   * @description Get node interface preference level.
   */
  this._return_node_interface_preferance_level = settings.return_node_interface_preferance_level;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {object}
   * @private
   * @description Dictionary from worker id to interfaces and details.
   */
  this._worker_peer_settings_dict = {};

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {integer}
   * @private
   * @description WorkerId.
   */
  this._my_worker_id = 0;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {buffer}
   * @private
   * @description WorkerId.
   */
  this._my_worker_id_4bytes;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {buffer}
   * @private
   * @description static_global_random_seed_4096bytes for GlobalDeterministicRandomManager.
   */
  this._static_global_random_seed_4096bytes;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {buffer}
   * @private
   * @description GlobalDeterministicRandomManager.
   */
   this._global_deterministic_random_manager = new GlobalDeterministicRandomManager({});

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {buffer}
   * @private
   * @description static_global_random_seed_checksum_4bytes.
   */
  this._static_global_random_seed_checksum_4bytes = Buf.from([0, 0, 0, 0]);

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {buffer}
   * @private
   * @description Worker authenticity data. Avoid being hacked. Provide in handshake communication.
   */
  this._my_worker_authenticity_data_bytes;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {buffer}
   * @private
   * @description Worker authenticity data. Avoid being hacked.
   */
  this._worker_peers_worker_ids_checksum_4bytes;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {function}
   * @private
   */
  this._multicast_request = settings.multicast_request;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {function}
   * @private
   */
  this._broadcast_request = settings.broadcast_request;

  /**
   * @memberof module:WorkerAffairProtocol
   * @type {object}
   * @private
   */
  this._event_listener_dict = {

  }
}

/**
 * @memberof module:WorkerAffairProtocol
 * @type {object}
 * @private
 */
WorkerAffairProtocol.prototype._ProtocolCodes = {
  worker_affair_worker_peer_join_request_respond: Buf.from([0x01]),
  worker_affair_worker_peer_update_request_respond: Buf.from([0x02]),
  worker_affair_worker_peer_leave_request_respond: Buf.from([0x03]),
  worker_affair_worker_peer_join_broadcast: Buf.from([0x04]),
  worker_affair_worker_peer_update_broadcast: Buf.from([0x05]),
  worker_affair_worker_peer_leave_broadcast: Buf.from([0x06]),
  worker_affair_worker_peer_operation_confirm_broadcast: Buf.from([0x07]),
  worker_affair_worker_peer_operation_cancel_broadcast: Buf.from([0x08]),

  accept: Buf.from([0x01]),
  reject: Buf.from([0x00]),
  unknown_reason_reject_2_bytes: Buf.from([0x00, 0x01]),
  authentication_reason_reject_2_bytes: Buf.from([0x00, 0x02])
}

// [Flag]
WorkerAffairProtocol.prototype.returnWorkerPeerSettingsByWorkerId = function(target_worker_peer_worker_id) {
  return this._worker_peer_settings_dict[target_worker_peer_worker_id];
}

// [Flag]
WorkerAffairProtocol.prototype.returnMyWorkerId = function() {
  return this._my_worker_id;
}

// [Flag]
WorkerAffairProtocol.prototype.returnAllWorkerIdList = function() {
  return Object.keys(this._worker_peer_settings_dict).map(x => parseInt(x));
}

// [Flag]
WorkerAffairProtocol.prototype.returnStaticGlobalRandomSeed4096Bytes = function() {
  return this._static_global_random_seed_4096bytes;
}

// [Flag]
WorkerAffairProtocol.prototype.returnGlobalDeterministicRandomManager = function () {
  return this._global_deterministic_random_manager;
}

// [Flag]
WorkerAffairProtocol.prototype.returnWorkerPeerConnectorsSettingsByWorkerId = function(target_worker_peer_worker_id) {
  const connectors_settings = this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings;
  let connectors_settings_index_sorted_by_preference_list = this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings_index_sorted_by_preference_list;
  // Finish index_sorted_by_preference_list
  const max_preference_level = 5; // Lower more preference.

  // Check connectors_settings_index_sorted_by_preference_list.
  if(connectors_settings_index_sorted_by_preference_list === null || typeof(connectors_settings_index_sorted_by_preference_list) === 'undefined') {

    connectors_settings_index_sorted_by_preference_list = [];
    for(let i = 0; i <= max_preference_level; i++) {
      for(let j in connectors_settings) {
        let interface_preference_level = connectors_settings[j].interface_preference_level;
        if(interface_preference_level === null  || typeof(interface_preference_level) === 'undefined') {
          const interface_name = connectors_settings[j].interface_name;
          // Get default from node module via protocl api.
          interface_preference_level = this._return_node_interface_preferance_level(interface_name);
        }
        if (parseInt(interface_preference_level) === parseInt(i)) {
          connectors_settings_index_sorted_by_preference_list.push(j);
        }
      }
    }

    // Cache it.
    this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings_index_sorted_by_preference_list = connectors_settings_index_sorted_by_preference_list;
    // console.log(this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings);
    // console.log(this._worker_peer_settings_dict[target_worker_peer_worker_id].connectors_settings_index_sorted_by_preference_list);
  }

  return {
    connectors_settings: connectors_settings,
    connectors_settings_index_sorted_by_preference_list: connectors_settings_index_sorted_by_preference_list
  };
}

WorkerAffairProtocol.prototype.getGlobalDeterministicRandomManager = function (callback) {
  if (this._global_deterministic_random_manager) {
    callback(false, this._global_deterministic_random_manager);
  } else {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('GlobalDeterministicRandomManager hasn\'t created yet.'));
  }
}

WorkerAffairProtocol.prototype.getAllWorkerPeersSettings = function (callback) {
  callback(false, this._worker_peer_settings_dict);
}

WorkerAffairProtocol.prototype.returnAllWorkerPeersSettings = function () {
  return this._worker_peer_settings_dict;
}

/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype.encodeAuthenticityBytes = function() {
  return Buf.concat([
    this._my_worker_id_4bytes,
    this._worker_peers_worker_ids_checksum_4bytes,
    this._static_global_random_seed_checksum_4bytes,
    this._my_worker_authenticity_data_bytes
  ]);
}

/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype.validateAuthenticityBytes = function(remote_authenticity_bytes, callback) {
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
    this._event_listener_dict['worker-peer-authenticate'](remote_worker_peer_worker_id, remote_worker_peer_authenticity_data, (is_authenticity_valid) => {
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

WorkerAffairProtocol.prototype.importStaticGlobalRandomSeed = function (static_global_random_seed_4096bytes, callback) {
  if (static_global_random_seed_4096bytes && Buf.isBuffer(static_global_random_seed_4096bytes) && static_global_random_seed_4096bytes.length === 4096) {
    this._static_global_random_seed_4096bytes = static_global_random_seed_4096bytes;
    this._static_global_random_seed_checksum_4bytes = Utils.hash4BytesMd5(static_global_random_seed_4096bytes);
    this._global_deterministic_random_manager.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, callback);
  } else callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported static global random seed buffer must have exactly 4096 bytes.'));
}

WorkerAffairProtocol.prototype.importMyWorkerAuthenticityData = function (worker_id, worker_authenticity_information, callback) {
  if (worker_id) {
    this._my_worker_id = worker_id;
    this._my_worker_id_4bytes = Buf.encodeUInt32BE(worker_id);
    this._my_worker_authenticity_data_bytes = this._nsdt_embedded_protocol.encode(worker_authenticity_information);
    callback(false);
  } else callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Imported worker authenticity data without worker id.'));
}

WorkerAffairProtocol.prototype.importWorkerPeersSettings = function (worker_peer_settings_dict, callback) {
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
      worker_peer_settings_dict[index]['worker_affair_locked'] = false;
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
}

// [Flag]
WorkerAffairProtocol.prototype.joinMe = function (remote_worker_connectors_settings, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, me_join_callback) {
  if (this._my_worker_id === 0) {
    // [Flag] Check field.
    // Shuffle for clientwise loadbalancing.
    const shuffled_connectors_settings_list = Utils.shuffleArray(remote_worker_connectors_settings);

    const my_worker_authenticity_data_bytes = this._nsdt_embedded_protocol.encode(my_worker_authenticity_data);
    const my_worker_connectors_settings_bytes = this._nsdt_embedded_protocol.encode(my_worker_connectors_settings);
    const my_worker_detail_bytes = this._nsdt_embedded_protocol.encode(my_worker_detail);

    const synchronize_message_bytes = Buf.concat([
      this._ProtocolCodes.worker_affair_worker_peer_join_request_respond,
      Buf.encodeUInt32BE(my_worker_authenticity_data_bytes.length),
      my_worker_authenticity_data_bytes,
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
        if (synchronize_acknowledgment_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_join_request_respond[0]) {
          // Acknowledgement information for handshake
          if (synchronize_acknowledgment_message_bytes[1] === this._ProtocolCodes.accept[0]) {
            // Accept.
            const new_worker_id = Buf.decodeUInt32BE(synchronize_acknowledgment_message_bytes.slice(2, 6));
            const static_global_random_seed_4096bytes = synchronize_acknowledgment_message_bytes.slice(6, 6 + 4096);
            const worker_peer_settings_dict = this._nsdt_embedded_protocol.decode(synchronize_acknowledgment_message_bytes.slice(6 + 4096));

            // Update worker peers settings
            this._worker_peer_settings_dict = worker_peer_settings_dict;
            this._static_global_random_seed_4096bytes = static_global_random_seed_4096bytes;
            this._global_deterministic_random_manager.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes);
            this._static_global_random_seed_checksum_4bytes = Utils.hash4BytesMd5(static_global_random_seed_4096bytes);
            this._updateWorkerPeersIdsChecksum4Bytes(Object.keys(worker_peer_settings_dict));

            acknowledge(false);
            me_join_callback(false, new_worker_id, worker_peer_settings_dict, static_global_random_seed_4096bytes);
          } else if (Utils.areBuffersEqual(synchronize_acknowledgment_message_bytes.slice(1, 3), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            acknowledge(false);
            me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'));
          } else if (Utils.areBuffersEqual(synchronize_acknowledgment_message_bytes.slice(1, 3), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            acknowledge(false);
            me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'));
          } else if (Utils.areBuffersEqual(synchronize_acknowledgment_message_bytes.slice(1, 3), Buf.from([0x00, 0x03]))) {
            acknowledge(false);
            me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Remote broadcasting error.'));
          } else {
            acknowledge(false);
            me_join_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown error.'));
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
}

// [Flag]
WorkerAffairProtocol.prototype.updateMe = function (my_worker_new_connectors_settings, my_new_worker_detail, me_update_callback) {
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

  const worker_affair_worker_peer_update_broadcast_bytes = Buf.concat([
    Buf.encodeUInt32BE(this._my_worker_id),
    Buf.encodeUInt32BE(my_worker_new_connectors_settings_bytes.length),
    my_worker_new_connectors_settings_bytes,
    my_new_worker_detail_bytes
  ]);

  this._broadcastWorkerAffairsWorkerPeerOperation('update', this._my_worker_id, worker_affair_worker_peer_update_broadcast_bytes, me_update_callback);
}

// [Flag]
WorkerAffairProtocol.prototype.leaveMe = function (me_leave_callback) {
  if(this._my_worker_id === 0) {
    me_leave_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('You have\'t join yourself yet.'));
    return;
  }

  const worker_affair_worker_peer_leave_broadcast_bytes = Buf.concat([
    Buf.encodeUInt32BE(this._my_worker_id)
  ]);

  this._broadcastWorkerAffairsWorkerPeerOperation('leave', this._my_worker_id, worker_affair_worker_peer_leave_broadcast_bytes, (error) => {
    if (error) {
      me_leave_callback(error);
    } else {
      me_leave_callback(error);
    }
  });
}

// [Flag]
WorkerAffairProtocol.prototype.leaveWorkerPeer = function (target_worker_peer_worker_id, me_leave_callback) {
  const worker_affair_worker_peer_update_broadcast_bytes = Buf.concat([
    Buf.encodeUInt32BE(target_worker_peer_worker_id)
  ]);
  this._broadcastWorkerAffairsWorkerPeerOperation('leave', target_worker_peer_worker_id, worker_affair_worker_peer_leave_broadcast_bytes, me_leave_callback);
}

WorkerAffairProtocol.prototype.getWorkerPeerDetail = function (target_worker_peer_worker_id, callback) {
  if (this._worker_peer_settings_dict[target_worker_peer_worker_id]) {
    callback(false, this._worker_peer_settings_dict[target_worker_peer_worker_id].detail);
  } else {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Does not exist worker peer with such worker id(' + target_worker_peer_worker_id + ').'));
  }
}


// [Flag]
WorkerAffairProtocol.prototype.start = function(callback) {
  if (callback) callback(false);
}

/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype._updateWorkerPeersIdsChecksum4Bytes = function(peers_worker_id_list) {
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
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype._setWorkerPeerWorkerAffairsLocked = function(worker_id, locked_by_worker_peer_with_worker_id) {
  if (this._worker_peer_settings_dict[worker_id]) {
    this._worker_peer_settings_dict[worker_id].worker_affair_locked = locked_by_worker_peer_with_worker_id;
  } else {
    this._worker_peer_settings_dict[worker_id] = {};
    this._worker_peer_settings_dict[worker_id].worker_affair_locked = locked_by_worker_peer_with_worker_id;
  }
}

/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype._setWorkerPeerWorkerAffairUnLocked = function(worker_id) {
  if (!this._worker_peer_settings_dict[worker_id].connectors_settings) {
    delete this._worker_peer_settings_dict[worker_id];
  } else if (this._worker_peer_settings_dict[worker_id]) {
    this._worker_peer_settings_dict[worker_id].worker_affair_locked = false;
  } else {
    this._worker_peer_settings_dict[worker_id] = {};
    this._worker_peer_settings_dict[worker_id].worker_affair_locked = false;
  }
}

/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype._isWorkerPeerWorkerAffairsLocked = function(worker_id) {
  const worker_peer_settings = this._worker_peer_settings_dict[worker_id];
  if (worker_peer_settings) {
    if (worker_peer_settings.worker_affair_locked) {
      return worker_peer_settings.worker_affair_locked;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype._broadcastWorkerAffairsWorkerPeerOperation = function(operation_type, target_worker_peer_worker_id, broadcast_bytes, callback) {
  const worker_affair_worker_peer_operations_ProtocolCodes = {
    'join': this._ProtocolCodes.worker_affair_worker_peer_join_broadcast,
    'update': this._ProtocolCodes.worker_affair_worker_peer_update_broadcast,
    'leave': this._ProtocolCodes.worker_affair_worker_peer_leave_broadcast
  };

  const my_worker_authenticity_bytes = this.encodeAuthenticityBytes();
  const worker_peer_opreation_byte = worker_affair_worker_peer_operations_ProtocolCodes[operation_type];

  const worker_affair_worker_peer_operation_broadcast_bytes = Buf.concat([
    worker_peer_opreation_byte,

    // My
    Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
    my_worker_authenticity_bytes,

    // Remote
    broadcast_bytes
  ]);

  const a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
    if (error) {
      confirm_error_finish_status(error, false);
    } else if (response_data_bytes[0] === worker_peer_opreation_byte[0]) {
      if (response_data_bytes[1] === this._ProtocolCodes.accept[0]) {
        confirm_error_finish_status(error, true);
      } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
        // [Flag]
        confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);
      } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
        // [Flag]
        confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);
      } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), Buf.from([0x00, 0x02]))) {
        // [Flag]
        confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker affairs operation collision error.'), false);
      } else {
        // [Flag]
        confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
      }
    }
  };

  const finished_listener = (error, finished_worker_id_list) => {
    const encoded_authenticity_bytes = this.encodeAuthenticityBytes();
    if (error) {
      // Cancel all operation done.
      const worker_affair_worker_peer_operation_cancel_broadcast_bytes = Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast,
        Buf.encodeUInt32BE(target_worker_peer_worker_id),
        encoded_authenticity_bytes
      ]);

      const a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
        if (response_data_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast[0]) {
          if (response_data_bytes[1] === this._ProtocolCodes.accept[0]) {
            confirm_error_finish_status(false, true);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);

          } else {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
          }
        } else {
          confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
        }
      };

      const inner_finished_listener = (error, inner_finished_worker_id_list) => {
        if (error) {
          console.log(error, inner_finished_worker_id_list);
        }
      };
      this._multicast_request(finished_worker_id_list, worker_affair_worker_peer_operation_cancel_broadcast_bytes, a_worker_response_listener, inner_finished_listener);
    } else {
      // confirm all operation done.
      const worker_affair_worker_peer_join_confirm_broadcast_bytes = Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_operation_confirm_broadcast,
        Buf.encodeUInt32BE(target_worker_peer_worker_id),
        encoded_authenticity_bytes
      ]);

      const a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
        if (response_data_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_operation_confirm_broadcast[0]) {
          if (response_data_bytes[1] === this._ProtocolCodes.accept[0]) {
            confirm_error_finish_status(false, true);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), this._ProtocolCodes.authentication_reason_reject_2_bytes)) {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), false);

          } else if (Utils.areBuffersEqual(response_data_bytes.slice(1, 3), this._ProtocolCodes.unknown_reason_reject_2_bytes)) {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), false);

          } else {
            confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
          }
        } else {
          confirm_error_finish_status(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), false);
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

      this._multicast_request(finished_worker_id_list, worker_affair_worker_peer_join_confirm_broadcast_bytes, a_worker_response_listener, inner_finished_listener);
    }
    callback(error);
  };

  this._broadcast_request(worker_affair_worker_peer_operation_broadcast_bytes, a_worker_response_listener, finished_listener);
}


/**
 * @memberof module:WorkerAffairProtocol
 * @private
 */
WorkerAffairProtocol.prototype._WorkerAffairsWorkerPeerOperationBroadcastSynchronizeListener = function(operation_type, synchronize_message_bytes, synchronize_acknowledgment) {

  const event_listener_names = {
    'join': 'worker-peer-join-request',
    'update': 'worker-peer-update-request',
    'leave': 'worker-peer-leave-request'
  };

  const event_listener_name = event_listener_names[operation_type];

  const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(0, 4));
  const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(4, 4 + remote_worker_peer_authenticity_bytes_length);
  this.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
    if ((operation_type === 'update' || operation_type === 'leave') && !Object.keys(this._worker_peer_settings_dict).includes(remote_worker_peer_worker_id + '')) {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
      ]));
    } else if (is_authenticity_valid) {

      const bytes_offseted = synchronize_message_bytes.slice(4 + remote_worker_peer_authenticity_bytes_length);
      const target_worker_peer_worker_id = Buf.decodeUInt32BE(bytes_offseted.slice(0, 4));

      // Check not blocked by other worker peer.
      if (this._isWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id)) {
        synchronize_acknowledgment(Buf.concat([
          Buf.from([0x00, 0x02]), // Reject. Locked error.
          Buf.encodeUInt32BE(this._isWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id)) // Locked by whom.
        ]));
      } else {
        const new_worker_peer_connectors_settings_bytes_length = (operation_type === 'leave') ? null : Buf.decodeUInt32BE(bytes_offseted.slice(4, 8));
        let new_worker_peer_connectors_settings = (operation_type === 'leave') ? null : this._nsdt_embedded_protocol.decode(bytes_offseted.slice(8, 8 + new_worker_peer_connectors_settings_bytes_length));
        let new_worker_peer_detail = (operation_type === 'leave') ? null : this._nsdt_embedded_protocol.decode(bytes_offseted.slice(8 + new_worker_peer_connectors_settings_bytes_length));

        this._setWorkerPeerWorkerAffairsLocked(target_worker_peer_worker_id, remote_worker_peer_worker_id);

        const next_of_worker_module = (error, on_confirm, on_cancel) => {
          this._worker_peer_settings_dict[target_worker_peer_worker_id].on_worker_affair_worker_peer_operation_confirm = on_confirm;
          this._worker_peer_settings_dict[target_worker_peer_worker_id].on_worker_affair_worker_peer_operation_cancel = on_cancel;
          if (error) {
            synchronize_acknowledgment(Buf.concat([
              this._ProtocolCodes.unknown_reason_reject_2_bytes // Reject. Authenticication error.
            ]));
          } else {
            // this._worker_peer_settings_dict[target_worker_peer_worker_id] = {
            //   interfaces: new_worker_peer_connectors_settings,
            //   detail: new_worker_peer_detail
            // };
            synchronize_acknowledgment(Buf.concat([
              this._ProtocolCodes.accept // Reject. Authenticication error.
            ]));
          }
        };

        if (operation_type === 'leave') {
          this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings = null;
          this._event_listener_dict[event_listener_name](target_worker_peer_worker_id, next_of_worker_module);
        } else if (operation_type === 'join') {
          this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings = {
            connectors_settings: new_worker_peer_connectors_settings,
            detail: new_worker_peer_detail
          };
          this._event_listener_dict[event_listener_name](target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, next_of_worker_module);
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
          this._event_listener_dict[event_listener_name](target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, next_of_worker_module);
        }
      }
    } else {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
      ]));
    }
  });
}

WorkerAffairProtocol.prototype.SynchronizeListener =  function(synchronize_message_bytes, synchronize_acknowledgment) {
  const synchronize_acknowledgment_error_handler = (error) => {
    // Server side error.
    // console.log(error);
  };

  if (synchronize_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_join_request_respond[0]) {
    // Corrupted settings.
    if (!this._static_global_random_seed_4096bytes || this._static_global_random_seed_4096bytes.length !== 4096) {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_join_request_respond,
        this._ProtocolCodes.unknown_reason_reject_2_bytes
      ]), synchronize_acknowledgment_error_handler);
      this._event_listener_dict['error'](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected worker join due to static_global_random_seed_4096bytes settings wrongly set.'));
      return;
    }

    const new_worker_authentication_bytes_length = Buf.decodeUInt32BE(synchronize_message_bytes.slice(1, 5));
    const new_worker_authenticity_data = this._nsdt_embedded_protocol.decode(synchronize_message_bytes.slice(5, 5 + new_worker_authentication_bytes_length));
    try {
      // Emit worker authentication from worker module.
      this._event_listener_dict['worker-peer-authenticate'](0, new_worker_authenticity_data, (is_authenticity_valid) => {
        if (is_authenticity_valid) {
          // Broadcast worker join.
          const bytes_offset_length = 5 + new_worker_authentication_bytes_length;
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

          const my_worker_authenticity_bytes = this.encodeAuthenticityBytes();

          const worker_affair_worker_peer_operation_broadcast_bytes = Buf.concat([
            Buf.encodeUInt32BE(new_worker_id),
            synchronize_message_bytes.slice(bytes_offset_length)
          ]);

          this._broadcastWorkerAffairsWorkerPeerOperation('join', new_worker_id, worker_affair_worker_peer_operation_broadcast_bytes, (error) => {
            if (error) {
              synchronize_acknowledgment(Buf.concat([
                this._ProtocolCodes.worker_affair_worker_peer_join_request_respond,
                Buf.from([0x00, 0x03]) // Reject Remote broadcasting error..
              ]), synchronize_acknowledgment_error_handler);
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
                this._ProtocolCodes.worker_affair_worker_peer_join_request_respond,
                this._ProtocolCodes.accept, // Accept.
                Buf.encodeUInt32BE(new_worker_id),
                this._static_global_random_seed_4096bytes,
                this._nsdt_embedded_protocol.encode(worker_peer_settings_dict)
              ]), synchronize_acknowledgment_error_handler);
            }
          });
        } else {
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.worker_affair_worker_peer_join_request_respond,
            this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject Authenticication error.
          ]), synchronize_acknowledgment_error_handler);
        }
      });
    } catch (error) {
      console.log(error);
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_join_request_respond,
        this._ProtocolCodes.unknown_reason_reject_2_bytes
      ]), synchronize_acknowledgment_error_handler);
    }
  } else if (synchronize_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_join_broadcast[0]) {
    this._WorkerAffairsWorkerPeerOperationBroadcastSynchronizeListener('join', synchronize_message_bytes.slice(1), (data_bytes) => {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_join_broadcast,
        data_bytes
      ]));
    });
  } else if (synchronize_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_update_broadcast[0]) {
    this._WorkerAffairsWorkerPeerOperationBroadcastSynchronizeListener('update', synchronize_message_bytes.slice(1), (data_bytes) => {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_update_broadcast,
        data_bytes
      ]));
    });
  } else if (synchronize_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_leave_broadcast[0]) {
    this._WorkerAffairsWorkerPeerOperationBroadcastSynchronizeListener('leave', synchronize_message_bytes.slice(1), (data_bytes) => {
      synchronize_acknowledgment(Buf.concat([
        this._ProtocolCodes.worker_affair_worker_peer_leave_broadcast,
        data_bytes
      ]));
    });
  } else if (synchronize_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_operation_confirm_broadcast[0]) {
    const target_worker_peer_worker_id = Buf.decodeUInt32BE(synchronize_message_bytes.slice(1, 5));
    const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(5);

    this.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
      // Validate authentication first.
      if (is_authenticity_valid) {
        const new_settings = this._worker_peer_settings_dict[target_worker_peer_worker_id].new_settings;
        if (new_settings === null) {
          delete this._worker_peer_settings_dict[target_worker_peer_worker_id];
          synchronize_acknowledgment(Buf.concat([
            this._ProtocolCodes.worker_affair_worker_peer_operation_confirm_broadcast,
            this._ProtocolCodes.accept
          ]));
        } else {
          const synchronize_acknowledgment_of_confirm = (error) => {
            if (error) {
              // Send reject to master.
              synchronize_acknowledgment(Buf.concat([
                this._ProtocolCodes.worker_affair_worker_peer_operation_confirm_broadcast,
                this._ProtocolCodes.unknown_reason_reject_2_bytes
              ]));
            } else {
              // Send accept to master.
              synchronize_acknowledgment(Buf.concat([
                this._ProtocolCodes.worker_affair_worker_peer_operation_confirm_broadcast,
                this._ProtocolCodes.accept
              ]));
            }
          };
          this._worker_peer_settings_dict[target_worker_peer_worker_id].on_worker_affair_worker_peer_operation_confirm(synchronize_acknowledgment_of_confirm);

          this._worker_peer_settings_dict[target_worker_peer_worker_id] = new_settings;
          // Recalculate checksum.
          this._updateWorkerPeersIdsChecksum4Bytes(Object.keys(this._worker_peer_settings_dict));

          this._setWorkerPeerWorkerAffairUnLocked(target_worker_peer_worker_id);
        }
      } else {
        // Send reject to master.
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast,
          this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
        ]));
      }
    });
  } else if (synchronize_message_bytes[0] === this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast[0]) {
    const target_worker_peer_worker_id = Buf.decodeUInt32BE(synchronize_message_bytes.slice(1, 5));
    const remote_worker_peer_authenticity_bytes = synchronize_message_bytes.slice(5);
    this.validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
      if (is_authenticity_valid) {
        const synchronize_acknowledgment_of_cancel = (error) => {
          if (error) {
            // Send reject to master.
            synchronize_acknowledgment(Buf.concat([
              this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast,
              this._ProtocolCodes.unknown_reason_reject_2_bytes
            ]));
          } else {
            // Send accept to master.
            synchronize_acknowledgment(Buf.concat([
              this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast,
              this._ProtocolCodes.accept
            ]));
          }
        };
        this._worker_peer_settings_dict[target_worker_peer_worker_id].on_worker_affair_worker_peer_operation_cancel(synchronize_acknowledgment_of_cancel);
        delete this._worker_peer_settings_dict[target_worker_peer_worker_id]['on_worker_affair_worker_peer_operation_cancel'];
        this._setWorkerPeerWorkerAffairUnLocked(target_worker_peer_worker_id);
      } else {
        // Send reject to master.
        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_affair_worker_peer_operation_cancel_broadcast,
          this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
        ]));
      }
    });
  } else synchronize_acknowledgment(false);
}

/**
 * @callback module:WorkerAffairProtocol~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerAffairProtocol
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description WorkerAffairProtocol events.
 */
WorkerAffairProtocol.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

module.exports = WorkerAffairProtocol;

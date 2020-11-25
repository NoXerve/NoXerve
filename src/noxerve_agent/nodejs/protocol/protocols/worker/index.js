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

const WorkerAffairProtocol = require("./worker_affair_protocol");
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
   * @type {object}
   * @private
   * @description Get node interface preference level.
   */
  this._return_node_interface_preferance_level = settings.return_node_interface_preferance_level;

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

  /**
   * @memberof module:WorkerProtocol
   * @type {object}
   * @private
   */
  this._worker_affair_protocol = new WorkerAffairProtocol({
    return_node_interface_preferance_level: this._return_node_interface_preferance_level,
    nsdt_embedded_protocol: this._nsdt_embedded_protocol,
    synchronize_function: (interface_name, connector_settings, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler) => {
      const decorated_synchronize_message_bytes = Buf.concat([this._ProtocolCodes.worker_affair, synchronize_message_bytes]);
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
          synchronize_acknowledgment_message_bytes[0] === this._ProtocolCodes.worker_affair[0]
        ) {
          synchronize_acknowledgment_handler(synchronize_acknowledgment_message_bytes.slice(1), decorated_acknowledge);
        } else {
          acknowledge(false);
          synchronize_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'));
        }
      };
      this._synchronize_function(interface_name, connector_settings, decorated_synchronize_message_bytes, synchronize_error_handler, decorated_synchronize_acknowledgment_handler);
    },
    multicast_request: (worker_id_list, data_bytes, a_worker_response_listener, finished_listener) => {
      const decorated_data_bytes = Buf.concat([this._ProtocolCodes.worker_affair, data_bytes]);
      const decorated_a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
        if(error) {
          a_worker_response_listener(worker_id, error, null, confirm_error_finish_status);
        }
        else if(
          response_data_bytes[0] === this._ProtocolCodes.worker_affair[0]
        ) {
          a_worker_response_listener(worker_id, error, response_data_bytes.slice(1), confirm_error_finish_status);
        } else {
          a_worker_response_listener(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_data_bytes.slice(3), confirm_error_finish_status);
        }
      };
      this._multicastRequest(worker_id_list, decorated_data_bytes, decorated_a_worker_response_listener, finished_listener);
    },
    broadcast_request: (data_bytes, a_worker_response_listener, finished_listener) => {
      const decorated_data_bytes = Buf.concat([this._ProtocolCodes.worker_affair, data_bytes]);
      const decorated_a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
        if(error) {
          a_worker_response_listener(worker_id, error, null, confirm_error_finish_status);
        }
        else if(
          response_data_bytes[0] === this._ProtocolCodes.worker_affair[0]
        ) {
          a_worker_response_listener(worker_id, error, response_data_bytes.slice(1), confirm_error_finish_status);
        } else {
          a_worker_response_listener(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_data_bytes.slice(3), confirm_error_finish_status);
        }
      };
      this._broadcastRequest(decorated_data_bytes, decorated_a_worker_response_listener, finished_listener);
    }
  });

  // Register imports.
  this._worker_module.on('static-global-random-seed-import', (static_global_random_seed_4096bytes, callback) => {
    this._worker_affair_protocol.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error) => {
      if(!error) {
        this._worker_module.GlobalDeterministicRandomManager = this._worker_affair_protocol.returnGlobalDeterministicRandomManager();
      }
      callback(error);
    });
  });

  this._worker_module.on('my-worker-authenticity-data-import', (worker_id, worker_authenticity_information, callback) => {
    this._worker_affair_protocol.importMyWorkerAuthenticityData(worker_id, worker_authenticity_information, callback);
  });

  this._worker_module.on('worker-peers-settings-import', (worker_peer_settings_dict, callback) => {
    this._worker_affair_protocol.importWorkerPeersSettings(worker_peer_settings_dict, callback);
  });
}

/**
 * @memberof module:WorkerProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._ProtocolCodes = {
  // Root protocol code
  worker_affair: Buf.from([0x02]),
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
WorkerProtocol.prototype._synchronizeWorkerPeerByWorkerId = function(
  target_worker_peer_worker_id, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler) {
  if(target_worker_peer_worker_id === this._worker_affair_protocol.returnMyWorkerId()) {
    this._synchronize_function('myself', null, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler);
    return;
  }

  else if (!this._worker_affair_protocol.returnWorkerPeerSettingsByWorkerId(target_worker_peer_worker_id)) {
    synchronize_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Does not exist worker peer with such worker(id: ' + target_worker_peer_worker_id + ').'));
    return;
  }
  else {
    const results = this._worker_affair_protocol.returnWorkerPeerConnectorsSettingsByWorkerId(target_worker_peer_worker_id);
    const connectors_settings = results.connectors_settings;
    const connectors_settings_index_sorted_by_preference_list = results.connectors_settings_index_sorted_by_preference_list;
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
      const interface_name = connectors_settings[connectors_settings_index_sorted_by_preference_list[index]].interface_name;
      const connector_settings = connectors_settings[connectors_settings_index_sorted_by_preference_list[index]].connector_settings;
      // "_" is for distincting the one from parameters.
      const _synchronize_error_handler = (synchronize_error) => {
        // Unable to open handshake. Next loop.
        synchronize_error_list.push(synchronize_error);
        loop_next();
      };

      // "_" is for distincting the one from parameters.
      const _synchronize_acknowledgment_handler = (synchronize_acknowledgment_message_bytes, acknowledge) => {
        // synchronize_acknowledgment_handler obtained from parameters.
        synchronize_acknowledgment_handler(synchronize_acknowledgment_message_bytes, acknowledge);
      };

      // Callbacks setup completed. Start handshake process.
      this._synchronize_function(interface_name, connector_settings, synchronize_message_bytes, _synchronize_error_handler, _synchronize_acknowledgment_handler);
    };

    // If it is worker itself. Make it easier.
    loop();
  }
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
WorkerProtocol.prototype._broadcastRequest = function(data_bytes, a_worker_response_listener, finished_listener) {
  this._multicastRequest(this._worker_affair_protocol.returnAllWorkerIdList(), data_bytes, a_worker_response_listener, finished_listener);
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
        validateAuthenticityBytes: this._worker_affair_protocol.validateAuthenticityBytes.bind(this._worker_affair_protocol),
        encodeAuthenticityBytes: this._worker_affair_protocol.encodeAuthenticityBytes.bind(this._worker_affair_protocol),
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
          const decorated_a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
            if(error) {
              a_worker_response_listener(worker_id, error, null, confirm_error_finish_status);
            }
            else if(
              response_data_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              response_data_bytes[1] === worker_object_protocol_code_1byte[0] &&
              response_data_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              a_worker_response_listener(worker_id, error, response_data_bytes.slice(3), confirm_error_finish_status);
            } else {
              a_worker_response_listener(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_data_bytes.slice(3), confirm_error_finish_status);
            }
          };
          this._multicastRequest(worker_id_list, decorated_data_bytes, decorated_a_worker_response_listener, finished_listener);
        },
        broadcastRequest: (data_bytes, a_worker_response_listener, finished_listener) => {
          const decorated_data_bytes = Buf.concat([prefix_data_bytes, data_bytes]);
          const decorated_a_worker_response_listener = (worker_id, error, response_data_bytes, confirm_error_finish_status) => {
            if(error) {
              a_worker_response_listener(worker_id, error, null, confirm_error_finish_status);
            }
            else if(
              response_data_bytes[0] === this._ProtocolCodes.worker_object[0] &&
              response_data_bytes[1] === worker_object_protocol_code_1byte[0] &&
              response_data_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
            ) {
              a_worker_response_listener(worker_id, error, response_data_bytes.slice(3), confirm_error_finish_status);
            } else {
              a_worker_response_listener(worker_id, new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'), response_data_bytes.slice(3), confirm_error_finish_status);
            }
          };
          this._broadcastRequest(decorated_data_bytes, decorated_a_worker_response_listener, finished_listener);
        },
      },
      return_my_worker_id: () => {
        return this._worker_affair_protocol.returnMyWorkerId();
      },
      return_worker_peers_settings: () => {
        return this._worker_affair_protocol.returnAllWorkerPeersSettings();
      },
      hash_manager: this._hash_manager,
      nsdt_embedded_protocol: this._nsdt_embedded_protocol,
      worker_global_protocol_codes: this._ProtocolCodes,
      static_global_random_seed_4096bytes: this._worker_affair_protocol.returnStaticGlobalRandomSeed4096Bytes(), // Critical for solving conflicts or without-communication consensus.
      global_deterministic_random_manager: this._worker_affair_protocol.returnGlobalDeterministicRandomManager()
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
    if(this._worker_affair_protocol.returnGlobalDeterministicRandomManager()) {
      this._createWorkerObjectProtocolWithWorkerSubprotocolManagers(worker_object_protocol_code_int, callback);
    }
    else {
      callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Please import static global random seed first.'));
    }
  });

  this._worker_module.on('me-join', (remote_worker_connectors_settings, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, me_join_callback) => {
    this._worker_affair_protocol.joinMe(remote_worker_connectors_settings, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, me_join_callback);
  });

  this._worker_module.on('me-update', (my_worker_new_connectors_settings, my_new_worker_detail, me_update_callback) => {
    this._worker_affair_protocol.updateMe(my_worker_new_connectors_settings, my_new_worker_detail, me_update_callback);
  });

  this._worker_module.on('me-leave', (me_leave_callback) => {
    this._worker_affair_protocol.leaveMe(me_leave_callback);
  });

  this._worker_module.on('worker-peer-leave', (target_worker_peer_worker_id, me_leave_callback) => {
    this._worker_affair_protocol.leaveWorkerPeer(target_worker_peer_worker_id, me_leave_callback);
  });

  this._worker_module.on('worker-peer-detail-get', (target_worker_peer_worker_id, callback) => {
    this._worker_affair_protocol.getWorkerPeerDetail(target_worker_peer_worker_id, callback);
  });

  this._worker_module.on('all-worker-peers-settings-get', (callback) => {
    this._worker_affair_protocol.getAllWorkerPeersSettings(callback);
  });

  this._worker_module.on('global-deterministic-random-manager-get', (callback) => {
    this._worker_affair_protocol.getGlobalDeterministicRandomManager(callback);
  });

  this._worker_affair_protocol.on('worker-peer-authenticate', (remote_worker_peer_worker_id, remote_worker_peer_authenticity_data, is_authenticity_valid_function) => {
    this._worker_module.emitEventListener('worker-peer-authenticate', remote_worker_peer_worker_id, remote_worker_peer_authenticity_data, is_authenticity_valid_function);
  });

  this._worker_affair_protocol.on('worker-peer-join-request', (target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, synchronize_acknowledgment_of_worker_module) => {
    this._worker_module.emitEventListener('worker-peer-join-request', target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, synchronize_acknowledgment_of_worker_module);
  });

  this._worker_affair_protocol.on('worker-peer-update-request', (target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, synchronize_acknowledgment_of_worker_module) => {
    this._worker_module.emitEventListener('worker-peer-update-request', target_worker_peer_worker_id, new_worker_peer_connectors_settings, new_worker_peer_detail, synchronize_acknowledgment_of_worker_module);
  });

  this._worker_affair_protocol.on('worker-peer-leave-request', (target_worker_peer_worker_id, synchronize_acknowledgment_of_worker_module) => {
    this._worker_module.emitEventListener('worker-peer-leave-request', target_worker_peer_worker_id, synchronize_acknowledgment_of_worker_module);
  });

  this._worker_affair_protocol.on('error', (error) => {
    this._worker_module.emitEventListener('error', error);
  });


  // this._worker_affair_protocol.on('', () => {
  //   this._worker_module.emitEventListener();
  // });

  this._worker_affair_protocol.start(callback);
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
 * @callback module:WorkerProtocol~synchronize_acknowledgment
 * @param {buffer} synchronize_returned_data
 * @param {function} synchronize_acknowledgment_error_handler
 * @param {function} acknowledge_handler
 */
/**
 * @memberof module:WorkerProtocol
 * @param {buffer} synchronize_message_bytes
 * @param {module:WorkerProtocol~synchronize_acknowledgment} synchronize_acknowledgment
 * @description Synchronize handshake from remote emitter.
 */
WorkerProtocol.prototype.SynchronizeListener = function(synchronize_message_bytes, synchronize_acknowledgment) {
  // Synchronize information for handshake
  // Worker Affairs Protocol
  const protocol_code_int = synchronize_message_bytes[0];
  if (protocol_code_int === this._ProtocolCodes.worker_affair[0]) {

    const decorated_synchronize_acknowledgment = (synchronize_acknowledgment_message_bytes, synchronize_acknowledgment_error_handler, acknowledge_handler) => {
      if(Buf.isBuffer(synchronize_acknowledgment_message_bytes)) {
        const decorated_acknowledge_handler = (acknowledge_message_bytes, tunnel) => {
          if (
            acknowledge_message_bytes[0] === this._ProtocolCodes.worker_affair[0]
          ) {
            acknowledge_handler(acknowledge_message_bytes.slice(1), tunnel);
          } else {
            synchronize_acknowledgment_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'));
            tunnel.close();
          }
        };

        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_affair,
          synchronize_acknowledgment_message_bytes
        ]), synchronize_acknowledgment_error_handler, decorated_acknowledge_handler);
      }
      else {
        synchronize_acknowledgment(false);
      }
    };

    this._worker_affair_protocol.SynchronizeListener(synchronize_message_bytes.slice(1), decorated_synchronize_acknowledgment);
    // Worker Object Protocols
  } else if (protocol_code_int === this._ProtocolCodes.worker_object[0]) {
    // Below codes are mainly related to prefix proccessing of worker object protocols.
    const worker_object_protocol_code_1byte = Buf.from([synchronize_message_bytes[1]]);
    const worker_subprotocol_protocol_code_1byte = Buf.from([synchronize_message_bytes[2]]);
    const sliced_synchronize_message_bytes = synchronize_message_bytes.slice(3);
    const worker_subprotocol_module = this._worker_object_protocol_with_worker_subprotocol_modules_dict[worker_object_protocol_code_1byte[0]][worker_subprotocol_protocol_code_1byte[0]];

    let error_listener;

    const decorated_synchronize_acknowledgment = (synchronize_acknowledgment_message_bytes, synchronize_acknowledgment_error_handler, acknowledge_handler) => {
      if(Buf.isBuffer(synchronize_acknowledgment_message_bytes)) {
        const decorated_acknowledge_handler = (acknowledge_message_bytes, tunnel) => {
          if (
            acknowledge_message_bytes[0] === this._ProtocolCodes.worker_object[0] &&
            acknowledge_message_bytes[1] === worker_object_protocol_code_1byte[0] &&
            acknowledge_message_bytes[2] === worker_subprotocol_protocol_code_1byte[0]
          ) {
            acknowledge_handler(acknowledge_message_bytes.slice(3), tunnel);
          } else {
            synchronize_acknowledgment_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker object or worker subprotocol protocol codes mismatched.'));
            tunnel.close();
          }
        };

        synchronize_acknowledgment(Buf.concat([
          this._ProtocolCodes.worker_object,
          worker_object_protocol_code_1byte,
          worker_subprotocol_protocol_code_1byte,
          synchronize_acknowledgment_message_bytes
        ]), synchronize_acknowledgment_error_handler, decorated_acknowledge_handler);
      }
      else {
        synchronize_acknowledgment(false);
      }
    };

    worker_subprotocol_module.SynchronizeListener(sliced_synchronize_message_bytes, decorated_synchronize_acknowledgment);
  } else {
    synchronize_acknowledgment(false);
  };
}

module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

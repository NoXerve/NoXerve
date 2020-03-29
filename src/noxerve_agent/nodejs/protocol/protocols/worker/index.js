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

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const NSDT = require('../../../nsdt');
const WorkerSocketProtocol = require('./non_uniform/worker_socket');
const WorkerAffairsProtocol = require('./worker_affairs');

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
   * @description WorkerAffairsProtocol submodule.
   */
  this._worker_affairs_protocol = new WorkerAffairsProtocol({
    hash_manager: settings.hash_manager,
    hash_manager: settings.hash_manager
  });
  //
  // this._worker_affairs_protocol.on('worker-peer-join');
  // this._worker_affairs_protocol.on('worker-peer-update');
  // this._worker_affairs_protocol.on('worker-peer-leave');

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
  worker_affairs: Buf.from([0x01]),
  worker_affairs_worker_join_request_respond: Buf.from([0x01]),
  worker_affairs_worker_update_request_respond: Buf.from([0x02]),
  worker_affairs_worker_leave_request_respond: Buf.from([0x03]),
  worker_affairs_worker_join_broadcast: Buf.from([0x04]),
  worker_affairs_worker_update_broadcast: Buf.from([0x05]),
  worker_affairs_worker_leave_broadcast: Buf.from([0x06]),
  worker_socket: Buf.from([0x02])
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
WorkerProtocol.prototype._openHandshakeFromWorkerId = function(
  worker_id, synchronize_information, acknowledge_synchronization, finish_handshake) {
  const interfaces = this._worker_peers_settings[worker_id].interfaces;

  // Stage 0: If loop to the end call acknowledge_synchronization with error.
  // Stage 1: If next_loop then call finish_handshake with error.
  let stage = 0;
  let index = 0;
  const open_handshanke_errors = [];
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
      acknowledge_synchronization(open_handshanke_errors, null, () => {});
    }
  };

  const loop = () => {
    const interface_name = interfaces[index].interface_name;
    const interface_connect_settings = interfaces[index].interface_connect_settings;

    // "_" is for distincting the one from parameters.
    const _acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
      if (open_handshanke_error) {
        // Unable to open handshake. Next loop.
        open_handshanke_errors.push(open_handshanke_error);
        loop_next();
        // Return acknowledge_information(not acknowledge).
        next(false);
      } else {
        stage = 1;

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
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._broadcastRequestResponse = function(worker_id_list, broadcast_bytes, on_a_worker_response, on_finish) {

  // Broadcast worker join start.
  // max concurrent connections.
  const max_connections_count = 2;
  const finished_worker_id_list = [];
  let escape_loop_with_error = false;
  let current_connections_count = 0;
  let index = 0;
  // let errors = {};

  const loop_over_workers = () => {
    const worker_id = worker_id_list[index];

    current_connections_count++;

    // Concurrently open connections.
    if (current_connections_count < max_connections_count) {
      loop_next();
    }

    const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
      current_connections_count--;

      next(false);
      on_a_worker_response(worker_id, open_handshanke_error, synchronize_acknowledgement_information, (error, is_finished) => {
        if (error) {
          escape_loop_with_error = error;
        }
        if (is_finished) {
          finished_worker_id_list.push(worker_id);
        }
        loop_next();
      });
    };

    const finish_handshake = (error, tunnel) => {
      // Not suppose to be called.
      // Request, response only have 2 progress instead of 3 full handshake.
    };

    this._openHandshakeFromWorkerId(worker_id, broadcast_bytes, acknowledge_synchronization, finish_handshake);
  };

  const loop_next = () => {
    index++;
    if (escape_loop_with_error && current_connections_count === 0) {
      on_finish(escape_loop_with_error, finished_worker_id_list);
    } else if (finished_worker_id_list.length === worker_id_list.length) {
      on_finish(false, finished_worker_id_list);
    } else if (index < worker_id_list.length && current_connections_count < max_connections_count) {
      loop_over_workers();
    }
  };

  loop_over_workers();
}

/**
 * @memberof module:WorkerProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._broadcastRequestResponseToAllWorkers = function(broadcast_bytes, on_a_worker_response, on_finish) {
  const worker_id_list = Object.keys(this._worker_peers_settings).map(x => parseInt(x));
  this._broadcastRequestResponse(worker_id_list, broadcast_bytes, on_a_worker_response, on_finish);
}

/**
 * @memberof module:WorkerProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._encodeAuthenticityBytes = function() {
  return Buf.concat([
    this._my_worker_id_4bytes,
    this._worker_peers_ids_checksum_4bytes,
    this._my_worker_authenticity_data_bytes
  ]);
}

/**
 * @memberof module:WorkerProtocol
 * @type {object}
 * @private
 */
WorkerProtocol.prototype._validateAuthenticityBytes = function(remote_authenticity_bytes, callback) {
  const remote_worker_id = Buf.decodeUInt32BE(remote_authenticity_bytes.slice(0, 4));
  const remote_worker_peers_ids_checksum_4bytes = remote_authenticity_bytes.slice(4, 8);
  const remote_worker_authenticity_data = NSDT.decode(remote_authenticity_bytes.slice(8));

  // Check worker_peers_ids_checksum_4bytes.
  if (Utils.areBuffersEqual(this._worker_peers_ids_checksum_4bytes, remote_worker_peers_ids_checksum_4bytes)) {
    try {
      // Emit worker authentication from worker module.
      this._worker_module.emitEventListener('worker-peer-authentication', remote_worker_id, remote_worker_authenticity_data, (is_authenticity_valid_validated) => {
        if (is_authenticity_valid_validated) {
          callback(false, true, remote_worker_id);
        } else {
          callback(false, false, remote_worker_id);
        }
      });
    } catch (error) {
      callback(error, false, null);
    }
  } else {
    callback(false, false, null);
  }
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
  this._worker_module.on('my-worker-authenticity-data-import', (worker_id, worker_authenticity_information, callback) => {
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

        // For worker-peer-join worker-peer-update worker-peer-leave.
        worker_peers_settings[index]['worker_affairs_locked'] = false;
      }
    }
    if (!include_myself) {
      // [Flag] Uncatogorized error.
      callback(this._my_worker_id);
      return;
    }
    this._worker_peers_settings = worker_peers_settings;
    // console.log(worker_peers_settings);
    this._worker_peers_ids_checksum_4bytes = Buf.encodeUInt32BE(worker_peers_ids_checksum);
    // Peacefully finish the job.
    callback(false);
  });

  this._worker_module.on('worker-socket-create',
    (worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, callback) => {
      const worker_socket_purpose_name_4bytes = this._hash_manager.hashString4Bytes(worker_socket_purpose_name);
      const worker_socket_purpose_parameter_bytes = NSDT.encode(worker_socket_purpose_parameter);
      const worker_authenticity_bytes = this._encodeAuthenticityBytes();

      const synchronize_information = Buf.concat([
        this._ProtocolCodes.worker_socket,
        Buf.encodeUInt32BE(worker_authenticity_bytes.length),
        worker_authenticity_bytes,
        worker_socket_purpose_name_4bytes,
        worker_socket_purpose_parameter_bytes
      ]);

      let _is_authenticity_valid = false;

      const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
        if (open_handshanke_error) {
          callback(open_handshanke_error);
          next(false);
        } else if (synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_socket[0] &&
          synchronize_acknowledgement_information[1] === 0x01
        ) {
          const remote_worker_authenticity_bytes = synchronize_acknowledgement_information.slice(2);
          // Auth remote worker.
          this._validateAuthenticityBytes(remote_worker_authenticity_bytes, (error, is_authenticity_valid, remote_worker_id) => {
            _is_authenticity_valid = is_authenticity_valid;
            if (is_authenticity_valid && !error) {
              next(Buf.concat([
                this._ProtocolCodes.worker_socket,
                Buf.from([0x01]), // Accept.
              ]));
            } else {
              next(Buf.concat([
                this._ProtocolCodes.worker_socket,
                Buf.from([0x00]), // Reject.
                Buf.from([0x00]) // Reject. Authenticication error.
              ]));
            }
          });
        } else if (synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_socket[0] &&
          synchronize_acknowledgement_information[1] === 0x00
        ) {
          if (synchronize_acknowledgement_information[2] === 0x00) {

            // [Flag] Uncatogorized error.
            callback('worker authentication error.');
            next(false);
          } else {

            // [Flag] Uncatogorized error.
            callback('Unknown error');
            next(false);
          }
        } else {
          callback('Unknown protocol');
          next(false);
        }
      };

      const finish_handshake = (error, tunnel) => {
        if (error) {
          callback(error);
        } else {
          if (_is_authenticity_valid) {
            this._worker_module.emitEventListener('worker-socket-request', (error, worker_socket) => {
              this._worker_socket_protocol.handleTunnel(error, worker_socket, tunnel);
              callback(error, worker_socket);
            });
          } else {
            // [Flag] Uncatogorized error.
            callback('Remote worker authentication failed.');
          }
        }
      };

      this._openHandshakeFromWorkerId(remote_worker_id, synchronize_information, acknowledge_synchronization, finish_handshake);
    });

  this._worker_module.on('hash-string-request', (worker_socket_purpose_name) => {
    this._hash_manager.hashString4Bytes(worker_socket_purpose_name);
  });

  this._worker_module.on('me-join', (remote_worker_interfaces, my_worker_interfaces, my_worker_detail, my_worker_authentication_data, me_join_callback) => {
    if (this._my_worker_id === null || this._my_worker_id === 0) {
      // Shuffle for clientwise loadbalancing.
      const shuffled_interface_connect_settings_list = Utils.shuffleArray(remote_worker_interfaces);

      const my_worker_authentication_data_bytes = NSDT.encode(my_worker_authentication_data);
      const my_worker_interfaces_bytes = NSDT.encode(my_worker_interfaces);
      const my_worker_detail_bytes = NSDT.encode(my_worker_detail);

      const synchronize_information = Buf.concat([
        this._ProtocolCodes.worker_affairs,
        this._ProtocolCodes.worker_affairs_worker_join_request_respond,
        Buf.encodeUInt32BE(my_worker_authentication_data_bytes.length),
        my_worker_authentication_data_bytes,
        Buf.encodeUInt32BE(my_worker_interfaces_bytes.length),
        my_worker_interfaces_bytes,
        my_worker_detail_bytes
      ]);

      // Proceed tunnel creations loop.
      let index = 0;
      // Loop loop() with condition.
      const loop_next = () => {
        index++;
        if (index < shuffled_interface_connect_settings_list.length) {
          loop();
        }
        // No more next loop. Exit.
        else {
          // [Flag] Uncatogorized error.
          me_join_callback('looped over interfaces but no success.');
        }
      };

      const loop = () => {
        const interface_name = shuffled_interface_connect_settings_list[index].interface_name;
        const interface_connect_settings = shuffled_interface_connect_settings_list[index].interface_connect_settings;

        const acknowledge_synchronization = (open_handshanke_error, synchronize_acknowledgement_information, next) => {
          if (open_handshanke_error) {
            // Unable to open handshake. Next loop.
            loop_next();

            // Return acknowledge_information(not acknowledge).
            next(false);
          } else {
            // Handshake opened. Check if synchronize_acknowledgement_information valid.
            try {
              if (synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_affairs[0] && synchronize_acknowledgement_information[1] === this._ProtocolCodes.worker_affairs_worker_join_request_respond[0]) {
                // Acknowledgement information for handshake
                // Format:
                // acknowledge byte
                // 0x01(ok)
                // 0x00(not ok)
                // const acknowledge_information = this._ProtocolCodes.worker_affairs;
                if (synchronize_acknowledgement_information[2] === 0x01) {
                  // Accept.



                } else if (synchronize_acknowledgement_information[2] === 0x00) {
                  // Reject.
                  if (synchronize_acknowledgement_information[3] === 0x00) {
                    me_join_callback('Unknown error');
                  }
                  else if (synchronize_acknowledgement_information[3] === 0x01) {
                    me_join_callback('auth error');
                  }
                  else if (synchronize_acknowledgement_information[3] === 0x02) {
                    me_join_callback('Broadcast error');
                  }
                }
                // Return acknowledge binary.
              } else {
                loop_next();
              }
            } catch (error) {
              // Unable to open handshake. Next loop.
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
      // [Flag] Uncatogorized error.
      callback('this worker has already joined.');
    }
  });

  this._worker_module.on('me-update', () => {
    // this._worker_affairs_protocol.updateMe(123, () => {
    //   this._openHandshakeFromWorkerId
    // });
  });

  this._worker_module.on('me-leave', () => {

  });

  this._worker_module.on('worker-peer-leave', () => {});

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
  // Format:
  // worker byte
  // 0x02 worker-affairs
  // 0x03 worker-socket
  if (synchronize_information[0] === this._ProtocolCodes.worker_affairs[0]) {
    onError(() => {

    });

    if (synchronize_information[1] === this._ProtocolCodes.worker_affairs_worker_join_request_respond[0]) {
      const remote_worker_authentication_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(2, 6));
      const remote_worker_authentication_data = NSDT.decode(synchronize_information.slice(6, 6 + remote_worker_authentication_bytes_length));
      try {
        // Emit worker authentication from worker module.
        this._worker_module.emitEventListener('worker-peer-authentication', 0, remote_worker_authentication_data, (is_authenticity_valid_validated) => {
          if (is_authenticity_valid_validated) {
            // Broadcast worker join.
            const bytes_offset_length = 6 + remote_worker_authentication_bytes_length;
            const remote_worker_interfaces_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(bytes_offset_length, bytes_offset_length + 4));
            const remote_worker_interfaces = NSDT.decode(synchronize_information.slice(bytes_offset_length + 4, bytes_offset_length + 4 + remote_worker_interfaces_bytes_length));
            const remote_worker_detail = NSDT.decode(synchronize_information.slice(bytes_offset_length + 4 + remote_worker_interfaces_bytes_length));
            console.log(remote_worker_interfaces, remote_worker_detail);

            // Obtain new Id.
            const worker_id_list = Object.keys(this._worker_peers_settings).map(x => parseInt(x));
            const max_worker_id = worker_id_list[worker_id_list.length - 1] + 1;
            let new_worker_id = 0;
            for (let id = 1; id <= max_worker_id; id++) {
              if (!worker_id_list.includes(id)) {
                new_worker_id = id;
                break;
              }
            }
            console.log(new_worker_id, worker_id_list);

            const my_worker_authenticity_bytes = this._encodeAuthenticityBytes();

            const worker_affairs_worker_join_broadcast_bytes = Buf.concat([
              this._ProtocolCodes.worker_affairs,
              this._ProtocolCodes.worker_affairs_worker_join_broadcast,
              Buf.encodeUInt32BE(my_worker_authenticity_bytes.length),
              my_worker_authenticity_bytes,
              synchronize_information.slice(bytes_offset_length)
            ]);

            const onAWorkerResponse = (worker_id, error, response_bytes, response_next) => {
              console.log(worker_id, error, response_bytes, next);
              if (error) {
                response_next(error, false);
              } else {
                response_next(false, true);
              }
            };

            const onFinish = (error, finished_worker_id_list) => {
              console.log(error, finished_worker_id_list);
              if (error) {
                next(Buf.concat([
                  this._ProtocolCodes.worker_affairs,
                  this._ProtocolCodes.worker_affairs_worker_join_request_respond,
                  Buf.from([0x00]), // Reject
                  Buf.from([0x02])
                ]));
                // this._broadcastRequestResponse(finished_worker_id_list, worker_affairs_worker_join_cancel_broadcast_bytes, onAWorkerResponse, onFinish);
              } else {

              }
            };

            this._broadcastRequestResponseToAllWorkers(worker_affairs_worker_join_broadcast_bytes, onAWorkerResponse, onFinish);

          } else {
            next(Buf.concat([
              this._ProtocolCodes.worker_affairs,
              this._ProtocolCodes.worker_affairs_worker_join_request_respond,
              Buf.from([0x00]), // Reject
              Buf.from([0x01])
            ]));
          }
        });
      } catch (error) {
        console.log(error);
        next(Buf.concat([
          this._ProtocolCodes.worker_affairs,
          this._ProtocolCodes.worker_affairs_worker_join_request_respond,
          Buf.from([0x00]), // Reject
          Buf.from([0x00])
        ]));
      }
    } else next(false);

  } else if (synchronize_information[0] === this._ProtocolCodes.worker_socket[0]) {
    const worker_id = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));
    const remote_worker_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_information.slice(1, 5));
    onError((error) => {
      console.log(error);
    });

    this._validateAuthenticityBytes(synchronize_information.slice(5, 5 + remote_worker_authenticity_bytes_length), (error, is_authenticity_valid_validated, remote_worker_id) => {
      if (is_authenticity_valid_validated && !error) {
        const worker_socket_purpose_name = this._hash_manager.stringify4BytesHash(synchronize_information.slice(5 + remote_worker_authenticity_bytes_length, 5 + remote_worker_authenticity_bytes_length + 4));
        const worker_socket_purpose_parameter = NSDT.decode(synchronize_information.slice(5 + remote_worker_authenticity_bytes_length + 4));
        // console.log(is_authenticity_valid_validated, remote_worker_id, remote_worker_authenticity_bytes_length, remote_worker_authenticity_bytes, worker_socket_purpose_name, worker_socket_purpose_parameter);

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
          }
        });

        next(Buf.concat([
          this._ProtocolCodes.worker_socket,
          Buf.from([0x01]), // Accept.
          this._encodeAuthenticityBytes()
        ]));

      } else {
        onAcknowledge((acknowledge_information, tunnel) => {
          // Reject.
          tunnel.close();
        });
        next(Buf.concat([
          this._ProtocolCodes.worker_socket,
          Buf.from([0x00]), // Reject.
          Buf.from([0x00]) // Reject. Authenticication error.
        ]));
      }
    });
  } else next(false);
}


module.exports = {
  protocol_name: 'worker',
  related_module_name: 'worker',
  module: WorkerProtocol
};

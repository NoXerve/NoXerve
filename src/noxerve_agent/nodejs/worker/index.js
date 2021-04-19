/**
 * @file NoXerveAgent worker index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Worker
 */

const Errors = require('../errors');
const WorkerSocketManager = require('./worker_object_managers/worker_socket');
const WorkerScopeManager = require('./worker_object_managers/worker_scope');
const WorkerGroupManager = require('./worker_object_managers/worker_group');
const WorkerShoalingManager = require('./worker_object_managers/worker_shoaling');
const AbsenceToleranceRecordCommissionManager = require('./worker_object_managers/absence_tolerance_record_commission');

/**
 * @constructor module:Worker
 * @param {object} settings
 * @description NoXerve Agent Worker Object. This module is a submodule hooked on NoXerveAgent object.
 */
function Worker(settings) {
  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._worker_object_managers = {
  };

  /**
   * @memberof module:Worker
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    'worker-peer-authenticate': (worker_id, worker_authenticity_information, is_valid) => {
      is_valid(false);
    },
    'worker-peer-join-request': (remote_worker_id, worker_peer_connectors_settings, worker_peer_detail, next) => {
      this._event_listener_dict['worker-peer-join'](remote_worker_id, worker_peer_connectors_settings, worker_peer_detail, next);
    },
    'worker-peer-update-request': (remote_worker_id, worker_peer_connectors_settings, worker_peer_detail, next) => {
      this._event_listener_dict['worker-peer-update'](remote_worker_id, worker_peer_connectors_settings, worker_peer_detail, next);
    },
    'worker-peer-leave-request': (remote_worker_id, next) => {
      this._event_listener_dict['worker-peer-leave'](remote_worker_id, next);
    },

    // Required listener default setted.
    'error': (error) => {
      console.log(error);
    }
  };
};

/**
 * @callback module:Worker~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_start} callback
 * @description Start the worker module.
 */
Worker.prototype.start = function(callback) {
  if(!callback) {callback = () => {};};
  // this._event_listener_dict['global-deterministic-random-manager-get']((error, global_deterministic_random_manager) => {
  //   console.log(error, global_deterministic_random_manager);
  // });
  if(this._event_listener_dict['worker-subprotocol-managers-request']) {
    this._event_listener_dict['hash-manager-request']((error, hash_manager) => {
      if(error) {callback(error); return;};
      this._event_listener_dict['nsdt-embedded-protocol-request']((error, nsdt_embedded_protocol) => {
        if(error) {callback(error); return;};
        // Request for worker group. With < 256 register_code.
        this._event_listener_dict['worker-subprotocol-managers-request'](WorkerGroupManager.register_code, (error, worker_subprotocol_object_managers)=> {
          if(error) {callback(error); return;};
          this._worker_object_managers['worker_group'] = new WorkerGroupManager.module({
            worker_subprotocol_object_managers: worker_subprotocol_object_managers,
            hash_manager: hash_manager,
            nsdt_embedded_protocol: nsdt_embedded_protocol
          });
          // Request for worker socket. With < 256 register_code.
          this._event_listener_dict['worker-subprotocol-managers-request'](WorkerSocketManager.register_code, (error, worker_subprotocol_object_managers)=> {
            if(error) {callback(error); return;};
            this._worker_object_managers['worker_socket'] = new WorkerSocketManager.module({
              worker_subprotocol_object_managers: worker_subprotocol_object_managers,
              hash_manager: hash_manager,
              nsdt_embedded_protocol: nsdt_embedded_protocol
            });
            // Request for worker scope. With < 256 register_code.
            this._event_listener_dict['worker-subprotocol-managers-request'](WorkerScopeManager.register_code, (error, worker_subprotocol_object_managers)=> {
              if(error) {callback(error); return;};
              this._worker_object_managers['worker_scope'] = new WorkerScopeManager.module({
                worker_subprotocol_object_managers: worker_subprotocol_object_managers,
                hash_manager: hash_manager,
                nsdt_embedded_protocol: nsdt_embedded_protocol
              });
              // Request for worker group. With < 256 register_code.
              this._event_listener_dict['worker-subprotocol-managers-request'](WorkerShoalingManager.register_code, (error, worker_subprotocol_object_managers)=> {
                if(error) {callback(error); return;};
                this._worker_object_managers['worker_shoaling'] = new WorkerShoalingManager.module({
                  worker_subprotocol_object_managers: worker_subprotocol_object_managers,
                  hash_manager: hash_manager,
                  nsdt_embedded_protocol: nsdt_embedded_protocol
                });
                this._event_listener_dict['worker-subprotocol-managers-request'](AbsenceToleranceRecordCommissionManager.register_code, (error, worker_subprotocol_object_managers)=> {
                  if(error) {callback(error); return;};
                  this._worker_object_managers['absence_tolerance_record_commission'] = new  AbsenceToleranceRecordCommissionManager.module({
                    worker_subprotocol_object_managers: worker_subprotocol_object_managers,
                    hash_manager: hash_manager,
                    nsdt_embedded_protocol: nsdt_embedded_protocol
                  });
                  callback(error);
                });
              });
            });
          });
        });
      });
    });
  }
  else {
    const error = new Errors.ERR_NOXERVEAGENT_WORKER('Worker module starting failed. Probably because protocol module has\'t started.');
    if (callback) callback(error);
    else throw error;
  }
}

/**
 * @callback module:Worker~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_close} callback
 * @description Close the worker module.
 */
Worker.prototype.close = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Worker~callback_of_import_my_worker_authenticity_data
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {noxerve_supported_data_type} worker_information
 * @param {module:Worker~callback_of_import_my_worker_authenticity_data} callback
 */
Worker.prototype.importMyWorkerAuthenticityData = function(worker_id, worker_authenticity_information, callback) {
  this._event_listener_dict['my-worker-authenticity-data-import'](worker_id, worker_authenticity_information, callback);
  // Tests
  this._worker_object_managers.absence_tolerance_record_commission.create('atr_commission_purpose_name', {
    commission_peers: [2],
    update_rate: 100,
    min_successful_update_rate: 90,
    records: {
      'r1': {
        // on_duty_commission_peer_id: 1,
        update_iterations: 0,
        value: 123
      },

    }
  }, (error, atr_commission) => {
    // setTimeout(() => {
    //   atr_commission.updateRecordValue('r1', 123, (error) => {
    //     console.log('atrc test', error);
    //   });
    //   atr_commission._getAliveCommissionPeers((error, result) => {
    //     console.log('atrc test', result);
    //   });
    // }, 100);

  });
}

/**
 * @callback module:Worker~callback_of_import_static_global_random_seed
 * @param {error} error
 * @param {object} global_deterministic_random_manager
 */
/**
 * @memberof module:Worker
 * @param {buffer} static_global_random_seed_4096bytes
 * @param {module:Worker~callback_of_import_static_global_random_seed} callback
 */
Worker.prototype.importStaticGlobalRandomSeed = function(static_global_random_seed_4096bytes, callback) {
  this._event_listener_dict['static-global-random-seed-import'](static_global_random_seed_4096bytes, callback);
}

/**
 * @callback module:Worker~callback_of_import_worker_id_to_interfaces_mapping
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {object} worker_peers_settings
 * @param {module:Worker~callback_of_import_worker_id_to_interfaces_mapping} callback
 * @description Import all worker ids and its corresponeding interfaces.
 */
Worker.prototype.importWorkerPeersSettings = function(worker_peers_settings, callback) {
  this._event_listener_dict['worker-peers-settings-import'](worker_peers_settings, callback);
}

/**
 * @callback module:Worker~callback_of_create_worker_socket
 * @param {object} worker_socket
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_socket} callback
 * @description Create a worker socket in order to communicate with another worker.
 */
Worker.prototype.createWorkerSocket = function(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback) {
  this._worker_object_managers.worker_socket.create(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_peer_worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_on_worker_socket_create
 * @param {noxerve_supported_data_type} worker_socket_purpose_parameter - The purpose for this worker socket. Along with it's parameter.
 * @param {integer} remote_worker_id - The worker that you want to communicate with.
 * @param {object} worker_socket
 */
/**
 * @memberof module:Worker
 * @param {string} worker_socket_purpose_name - The purpose for this worker socket.
 * @param {module:Worker~callback_of_on_worker_socket_create} listener
 * @description Handle worker socket emitted from remote worker.
 */
Worker.prototype.onWorkerSocketCreate = function(worker_socket_purpose_name, listener) {
  this._worker_object_managers.worker_socket.onCreate(worker_socket_purpose_name, listener);
}

/**
 * @callback module:Worker~callback_of_create_worker_scope
 * @param {object} worker_scope
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} worker_scope_purpose_name - The purpose for this worker scope.
 * @param {list} worker_peers_worker_id_list - The worker peers that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_scope} callback
 * @description Create a worker scope in order to communicate with another worker.
 */
Worker.prototype.createWorkerScope = function(worker_scope_purpose_name, worker_peers_worker_id_list, callback) {
  this._worker_object_managers.worker_scope.create(worker_scope_purpose_name, worker_peers_worker_id_list, callback);
}

/**
 * @callback module:Worker~callback_of_create_worker_group
 * @param {object} worker_group
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} worker_group_purpose_name - The purpose for this worker group.
 * @param {list} worker_peers_worker_id_list - The worker peers that you want to communicate with.
 * @param {module:Worker~callback_of_create_worker_group} callback
 * @description Create a worker group in order to communicate with another worker.
 */
Worker.prototype.createWorkerGroup = function(worker_group_purpose_name, worker_peers_worker_id_list, callback) {
  this._worker_object_managers.worker_group.create(worker_group_purpose_name, worker_peers_worker_id_list, callback);
}
/**
 * @callback module:Worker~callback_of_create_worker_shoaling
 * @param {object} worker_shoaling
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param  {string}   worker_shoaling_purpose_name - The purpose for this worker shoaling.
 * @param  {list}   worker_peers_worker_id_list - The worker peers including in this shoaling.
 * @param  {module:Worker~callback_of_create_worker_shoaling} callback
 */
Worker.prototype.createWorkerShoaling = function(worker_shoaling_purpose_name, worker_peers_worker_id_list, callback) {
  this._worker_object_managers.worker_shoaling.create(worker_shoaling_purpose_name, worker_peers_worker_id_list, callback);
}

/**
 * @callback module:Worker~callback_of_create_absence_tolerance_record_commission
 * @param {object} absence_tolerance_record_commission
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} atr_commission_purpose_name - The purpose for this absence tolerance record commission.
 * @param {list} worker_peers_worker_id_list - The worker peers that you want to communicate with.
 * @param {module:Worker~callback_of_create_absence_tolerance_record_commission} callback
 * @description Create a absence_tolerance_record_commission in order to save records.
 */
Worker.prototype.createAbsenceToleranceRecordCommission = function(atr_commission_purpose_name, settings, callback) {
  this._worker_object_managers.absence_tolerance_record_commission.create(worker_group_purpose_name, settings, callback);
}

/**
 * @callback module:Worker~callback_of_join_me
 * @param {error} error
 * @param {integer} worker_id
 * @param {object} worker_peers_settings
 */
/**
 * @memberof module:Worker
 * @param {array} my_worker_interfaces - This worker avaliable interfaces.
 * @param {noxerve_supported_data_type} my_worker_detail - Detail of this worker.
 * @param {noxerve_supported_data_type} my_worker_authenticity_data - Authenticication data of this worker.
 * @param {module:Worker~callback_of_join_me} callback
 * @description Join myself into workers cluster.
 */
Worker.prototype.joinMe = function(remote_worker_interfaces_connect_setting, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, callback) {
  this._event_listener_dict['me-join'](remote_worker_interfaces_connect_setting, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, callback);
}

/**
 * @callback module:Worker~callback_of_update_me
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {array} my_worker_interfaces - This worker avaliable interfaces.
 * @param {noxerve_supported_data_type} my_worker_detail - Detail of this worker.
 * @param {module:Worker~callback_of_update_me} callback
 * @description Update this worker with new informations.
 */
Worker.prototype.updateMe = function(my_worker_connectors_settings, my_worker_detail, callback) {
  this._event_listener_dict['me-update'](my_worker_connectors_settings, my_worker_detail, callback);
}

/**
 * @callback module:Worker~callback_of_leave_me
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_leave_me} callback
 * @description Leave this worker away from workers cluster.
 */
Worker.prototype.leaveMe = function(callback) {
  this._event_listener_dict['me-leave'](callback);
}

/**
 * @callback module:Worker~callback_of_leave_worker_peer
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {module:Worker~callback_of_leave_worker_peer} callback
 * @description Leave this worker away from workers cluster by worker id. Which
 * implies that you can remove any worker from workers cluster.
 */
Worker.prototype.leaveWorkerPeer = function(worker_id, callback) {
  this._event_listener_dict['worker-peer-leave'](worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_abandon_worker_peer
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {module:Worker~callback_of_abandon_worker_peer} callback
 * @description Abandon this workers away from workers cluster by worker ids nastily.
 * Do not notify workers which will be abandoned.
 */
Worker.prototype.abandonWorkerPeers = function(worker_id_list, callback) {
  this._event_listener_dict['worker-peers-abandon'](worker_id_list, callback);
}

/**
 * @callback module:Worker~callback_of_worker_peer_detail_get
 * @param {error} error
 * @param {noxerve_supported_data_type} detail
 */
/**
 * @memberof module:Worker
 * @param {integer} worker_id
 * @param {module:Worker~callback_of_worker_peer_detail_get} callback
 */
Worker.prototype.getWorkerPeerDetail = function(worker_id, callback) {
  this._event_listener_dict['worker-peer-detail-get'](worker_id, callback);
}

/**
 * @callback module:Worker~callback_of_all_worker_peers_settings_get
 * @param {error} error
 * @param {noxerve_supported_data_type} worker_peers_settings
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_all_worker_peers_settings_get} callback
 */
Worker.prototype.getAllWorkerPeersSettings = function(callback) {
  this._event_listener_dict['all-worker-peers-settings-get'](callback);
}

/**
 * @callback module:Worker~callback_of_worker_peer_detail_get
 * @param {error} error
 * @param {object} global_deterministic_random_manager
 */
/**
 * @memberof module:Worker
 * @param {module:Worker~callback_of_worker_peer_detail_get} callback
 */
Worker.prototype.getGlobalDeterministicRandomManager = function(callback) {
  this._event_listener_dict['global-deterministic-random-manager-get'](callback);
}

/**
 * @callback module:Worker~callback_of_on
 * @param {error} error
 * @description Parameters depends.
 */
/**
 * @memberof module:Worker
 * @param {string} event_name - "ready" "error" "close"
 * @param {module:Worker~callback_of_on} listener
 * @description Worker events.
 */
Worker.prototype.on = function(event_name, listener) {
  this._event_listener_dict[event_name] = listener;
}

/**
 * @memberof module:Worker
 * @param {string} event_name
 * @description Worker events emitter. For internal uses.
 */
Worker.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = Worker;

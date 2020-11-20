/**
 * @file NoXerveAgent index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module NoXerveAgent
 */

const Errors = require('./errors');
const Worker = require('./worker');
const Service = require('./service/service');
const Activity = require('./service/activity');
const NSDT = require('./nsdt');
const Protocol = require('./protocol');
const Node = require('./node');
const SecuredNode = require('./node/secured_node');


/**
 * @constructor module:NoXerveAgent
 * @param {object} settings
 * @description NoXerve Agent Object
 */
function NoXerveAgent(settings) {

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Worker
   * @private
   * @description API intended to provide functions for the role of worker.
   */
  this._worker_module = new Worker();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @private
   * @description API intended to provide functions for the role of service.
   */
  this._service_module = new Service();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Activity
   * @private
   * @description API intended to provide functions for the role of service.
   */
  this._activity_module = new Activity();

  if(settings.secured_node === true) {
    /**
     * @memberof module:NoXerveAgent
     * @type {object}
     * @see module:Node
     * @private
     * @description Module for tunneling.
     */
    this._node_module = new SecuredNode({rsa_2048_key_pair: settings.rsa_2048_key_pair});
  }
  else {
    /**
     * @memberof module:NoXerveAgent
     * @type {object}
     * @see module:Node
     * @private
     * @description Module for tunneling.
     */
    this._node_module = new Node();
  }
  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Node
   * @private
   * @description Module for tunneling.
   */
  this._nsdt_module = new NSDT();

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Node
   * @private
   * @description Module for protocols.
   */
  this._protocol_module = new Protocol({
    modules: {
      activity: this._activity_module,
      service: this._service_module,
      worker: this._worker_module,
      nsdt: this._nsdt_module
    },
    node_module: this._node_module
  });


  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Worker
   * @description API intended to provide functions for the role of worker.
   */
  this.Worker = {
    importMyWorkerAuthenticityData: (worker_id, worker_authenticity_information, callback) => {
      this._worker_module.importMyWorkerAuthenticityData(worker_id, worker_authenticity_information, callback);
    },
    importStaticGlobalRandomSeed: (static_global_random_seed_4096bytes, callback) => {
      this._worker_module.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, callback);
    },
    importWorkerPeersSettings: (worker_peers_settings, callback) => {
      this._worker_module.importWorkerPeersSettings(worker_peers_settings, callback);
    },
    createWorkerSocket: (worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, callback) => {
      this._worker_module.createWorkerSocket(worker_socket_purpose_name, worker_socket_purpose_parameter, remote_worker_id, callback);
    },
    onWorkerSocketCreate: (worker_socket_purpose_name, listener) => {
      this._worker_module.onWorkerSocketCreate(worker_socket_purpose_name, listener);
    },
    createWorkerScope: (worker_scope_purpose_name, worker_peers_worker_id_list, callback) => {
      this._worker_module.createWorkerScope(worker_scope_purpose_name, worker_peers_worker_id_list, callback);
    },
    getWorkerPeerDetail: (worker_id, callback) => {
      this._worker_module.getWorkerPeerDetail(worker_id, callback);
    },
    getAllWorkerPeersSettings: (callback) => {
      this._worker_module.getAllWorkerPeersSettings(callback);
    },
    getGlobalDeterministicRandomManager: (callback) => {
      this._worker_module.getGlobalDeterministicRandomManager(callback);
    },
    createWorkerGroup: (worker_group_purpose_name, worker_peers_worker_id_list, callback) => {
      this._worker_module.createWorkerGroup(worker_group_purpose_name, worker_peers_worker_id_list, callback);
    },
    on: (event_name, listener) => {
      this._worker_module.on(event_name, listener);
    },
    joinMe: (remote_worker_interfaces, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, callback) => {
      this._worker_module.joinMe(remote_worker_interfaces, my_worker_connectors_settings, my_worker_detail, my_worker_authenticity_data, callback);
    },
    updateMe: (my_worker_connectors_settings, my_worker_detail, callback) => {
      this._worker_module.updateMe(my_worker_connectors_settings, my_worker_detail, callback);
    },
    leaveMe: (callback) => {
      this._worker_module.leaveMe(callback);
    },
    leaveWorkerPeer: (worker_id, callback) => {
      this._worker_module.leaveWorkerPeer(worker_id, callback);
    },
    abandonWorkerPeers: (worker_id_list, callback) => {
      this._worker_module.abandonWorkerPeers(worker_id_list, callback);
    }
  };

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @description API intended to provide functions for the role of service.
   */
  this.Service = {
    on: (event_name, listener) => {
      this._service_module.on(event_name, listener);
    },
    onActivityCreate: (activity_purpose_name, listener) => {
      this._service_module.onActivityCreate(activity_purpose_name, listener);
    }
  };

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @description API intended to provide functions for the role of service.
   */
  this.Activity = {
    createActivity: (connector_settings_list, activity_purpose_name, activity_purpose_parameters, callback) => {
      this._activity_module.createActivity(connector_settings_list, activity_purpose_name, activity_purpose_parameters, callback);
    }
  };

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:NSDT
   * @description NoXerve Supported Data Type module. Encode, Decode from and to
   * blob and supported data type.
   */
  this.NSDT = {
    createCallableStructure: (name_to_function_dictionary, callback) => {
      return this._nsdt_module.createCallableStructure(name_to_function_dictionary, callback);
    }
  };
};

/**
 * @callback module:NoXerveAgent~callback_of_create_interface
 * @param {int} interface_id
 * @param {error} error
 */
/**
 * @memberof module:NoXerveAgent
 * @param {string} interface_name - 'TCP', 'Websocket', etc
 * @param {object} interface_settings - port, crypto, etc
 * @param {module:NoXerveAgent~callback_of_create_interface} callback
 */
NoXerveAgent.prototype.createInterface = function(interface_name, interface_settings, callback) {
  // This operation handled by Node module.
  this._node_module.createInterface(interface_name, interface_settings, callback);
}

/**
 * @callback module:NoXerveAgent~callback_of_destroy_interface
 * @param {error} error
 */
/**
 * @memberof module:NoXerveAgent
 * @param {int} interface_id
 * @param {module:NoXerveAgent~callback_of_destroy_interface} callback
 */
NoXerveAgent.prototype.destroyInterface = function(interface_id, callback) {
  // This operation handled by Node module.
  this._node_module.destroyInterface(interface_id, callback);
}

/**
 * @callback module:NoXerveAgent~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:NoXerveAgent
 * @param {module:NoXerveAgent~callback_of_start} callback
 * @description Start NoXerveAgent.
 */
NoXerveAgent.prototype.start = function(callback) {
  // Start all modules.
  this._protocol_module.start((error) => {
    if(error) {
      console.log(error);
      callback(error);
      return;
    };
    // console.log(1);
    this._node_module.start((error) => {
      if(error) {
        console.log(error);
        callback(error);
        return;
      };
      // console.log(2);
      this._worker_module.start((error) => {
        if(error) {
          console.log(error);
          callback(error);
          return;
        };
        // console.log(3);
        this._activity_module.start((error) => {
          if(error) {
            console.log(error);
            callback(error);
            return;
          };
          // console.log(4);
          this._service_module.start(callback);
        });
      });
    });
  });
}

/**
 * @callback module:NoXerveAgent~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:NoXerveAgent
 * @param {module:NoXerveAgent~callback_of_close} callback
 * @description Gracefully close NoXerveAgent.
 */
NoXerveAgent.prototype.close = function(callback) {
  // Close tunnels first
  this._node_module.close(() => {

  });
}

module.exports = NoXerveAgent;

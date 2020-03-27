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
const Protocol = require('./protocol');
const Node = require('./node');
// let SecuredNode = require('./node/secured_node');


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

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Node
   * @private
   * @description Module for tunneling.
   */
  this._node_module = new Node();

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
      worker: this._worker_module
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
    importWorkerAuthenticityData: (worker_id, worker_authenticity_information, callback) => {
      this._worker_module.importWorkerAuthenticityData(worker_id, worker_authenticity_information, callback);
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
    on: (event_name, listener) => {
      this._worker_module.on(event_name, listener);
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
    }
  };

  /**
   * @memberof module:NoXerveAgent
   * @type {object}
   * @see module:Service
   * @description API intended to provide functions for the role of activity.
   */
  this.Activity = {
    createActivity: (interface_connect_settings_list, callback) => {
      this._activity_module.createActivity(interface_connect_settings_list, callback);
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
  // This opreation handled by Node module.
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
  // This opreation handled by Node module.
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
  this._worker_module.start((error) => {
    if(error) {
      console.log(error);
      callback(error);
      return;
    };
    // console.log(1);
    this._activity_module.start((error) => {
      if(error) {
        console.log(error);
        callback(error);
        return;
      };
      // console.log(2);
      this._service_module.start((error) => {
        if(error) {
          console.log(error);
          callback(error);
          return;
        };
        // console.log(3);
        this._protocol_module.start((error) => {
          if(error) {
            console.log(error);
            callback(error);
            return;
          };
          // console.log(4);
          this._node_module.start(callback);
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

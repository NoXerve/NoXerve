/**
 * @file NoXerveAgent Scope file. [scope.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Scope
 */

const Errors = require('../../../../errors');
const MaxScopePeersCount = 512;
// const MaxScopePeersConnectionsCount = 512;

/**
 * @constructor module:Scope
 * @param {object} settings
 * @description Scope Object.
 */

function Scope(settings) {
  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
  this._settings = settings;

  this._scope_peers_settings = settings.scope_peers_settings;

  // /**
  //  * @memberof module:Scope
  //  * @type {boolean}
  //  * @private
  //  */
  // this._complete = false;

  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
  this._scope_peers_connections_dict = {};

  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'passively-close': () => {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if (close_handler) close_handler();
    },

    // // not complete. Such as a peer lose connection.
    // 'defect': () => {
    //
    // },

    'activity-create': () => {

    },

    'data': (scope_id, data) => {

    },

  };

  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
   this._my_scope_peer_id;
}

Scope.prototype.onActivityCreate = function(listener) {
  this._event_listeners['activity-create'] = listener;
}

Scope.prototype.send = function(scope_peer_id, data, callback) {

}

Scope.prototype.multicastRequestResponse = function(scope_peer_id_list, data_bytes, on_a_worker_response, on_finish) {
}

Scope.prototype.broadcastRequestResponse = function(data_bytes, on_a_worker_response, on_finish) {
}

Scope.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

// Scope.prototype.joinPeer = function(worker_id, scope_peer_detail, callback) {
//   let scope_peer_id;
// }
//
// Scope.prototype.updatePeer = function(scope_peer_id, scope_peer_detail, callback) {
//
// }
//
// Scope.prototype.leavePeer = function(scope_peer_id, callback) {
//
// }

// Note that this synchronize is protocol's "synchronize". Not data synchronization.
Scope.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {

}

/**
 * @memberof module:Scope
 * @param {string} event_name
 * @description Scope events emitter. For internal uses.
 */
Scope.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = Scope;

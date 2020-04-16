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
const ScopeMaxPeersCount = 512;

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

  /**
   * @memberof module:Scope
   * @type {boolean}
   * @private
   */
  this._complete = false;

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

    // not complete. Such as a peer lose connection.
    'defect': () => {

    },

    'activity-create': () => {

    },

    'data': (scope_id, data) => {

    }
  };

  /**
   * @memberof module:Scope
   * @type {object}
   * @private
   */
   this._my_scope_peer_id;
}

Scope.prototype.onActivityCreate = function(listener) {

}

Scope.prototype.send = function(scope_peer_id_list, data, callback) {

}

Scope.prototype.multicast = function(scope_peer_id_list, data, callback) {
  if (this._complete) {

  } else {
    if (callback) callback();
  }
}

Scope.prototype.broadcast = function(data, callback) {
  if (this._complete) {

  } else {
    if (callback) callback();
  }
}

Scope.prototype.onDefect = function(listener) {

}

// Connection peers.
Scope.prototype.makeComplete = function(callback) {

}

Scope.prototype.joinPeer = function(callback) {
  let scope_peer_id;
}

Scope.prototype.leavePeer = function(scope_peer_id, callback) {

}

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

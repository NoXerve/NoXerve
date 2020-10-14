/**
 * @file NoXerveAgent worker group file. [worker_group.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroup
 */

const Errors = require('../../../../../errors');
const Buf = require('../../../../../buffer');
const Locker = require('./objects/locker');
const SyncQueue = require('./objects/sync_queue');
const AsyncQueue = require('./objects/async_queue');

/**
 * @constructor module:WorkerGroup
 * @param {object} settings
 * @description NoXerveAgent worker's WorkerGroup object.
 */


function WorkerGroup(settings) {
  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._group_peers_count = settings.group_peers_count;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  // this._group_peers_list = settings.group_peers_list;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._create_tunnel = settings.create_tunnel;

  /**
   * @memberof module:WorkerGroup
   * @type {function}
   * @private
   */
  this._on_tunnel_create = settings.on_tunnel_create;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._event_listeners = {

    'connections-broken': () => {},

    'locker-create': () => {},
    'sync-queue-create': () => {},
    'async-queue-create': () => {},

    'locker-resume': () => {},
    'sync-queue-resume': () => {},
    'async-queue-resume': () => {},
  };

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._active_locker_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._active_sync_queue_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._active_async_queue_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._group_peer_tunnel_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._on_data_object_register_code_object_id_dict = {};
}

/**
 * @memberof module:WorkerGroupProtocol
 * @type {object}
 * @private
 */
WorkerGroup.prototype._ProtocolCodes = {
  onetime_data: Buf.from([0x00]),
  request_response: Buf.from([0x01]),
  handshake: Buf.from([0x01])
};

WorkerGroup.prototype._sendWithObjectIdWithoutProtocolCodePrefix = function(object_register_code_byte, object_id_8bytes, group_peer_id, data_bytes, callback) {
  this._group_peer_tunnel_dict[group_peer_id].tunnel.send(Buf.concat([
    object_register_code_byte,
    object_id_8bytes,
    data_bytes
  ]), callback);
};

// [Flag]
WorkerGroup.prototype._setupTunnelWithObjectIdPrefix = function(group_peer_id, tunnel) {
  // Register tunnel.
  this._group_peer_tunnel_dict[group_peer_id].tunnel = tunnel;

  // Register events.
  tunnel.on('error', (error) => {
    console.log(error);
    this._group_peer_tunnel_dict[group_peer_id].status = 0;
    this._group_peer_tunnel_dict[group_peer_id].tunnel = null;
    tunnel.close();
  });

  tunnel.on('data', (data) => {
    const object_register_code = data[0];
    const object_id_8bytes = data.slice(1, 9);
    const data_bytes = data.slice(9);
    this._on_data_object_register_code_object_id_dict[object_register_code][object_id_8bytes.toString()](group_peer_id, data_bytes);
  });

  // Start flushing to be sent list.
  const to_be_sent_list = this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list;
  // Clear to be sent list.
  this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list = [];
  to_be_sent_list.forEach((to_be_sent_informations) => {
    const _object_register_code_byte = to_be_sent_informations[0];
    const _object_id_8bytes = to_be_sent_informations[1];
    const _group_peer_id = to_be_sent_informations[2];
    const _data_bytes = to_be_sent_informations[3];
    const _callback = to_be_sent_informations[4];
    this._sendWithObjectIdWithoutProtocolCodePrefix(_object_register_code_byte, _object_id_8bytes, _group_peer_id, _data_bytes, _callback);
  });

  // Change status.
  this._group_peer_tunnel_dict[group_peer_id].status = 2;
}

// // [Flag]
// WorkerGroup.prototype._destroyTunnel = function(group_peer_id) {
//   // this._group_peer_tunnel_dict[group_peer_id].tunnel = tunnel;
// }

// [Flag]
WorkerGroup.prototype._registerObjectIdOnData = function(object_register_code, object_id_8bytes, on_data_listener) {
  this._on_data_object_register_code_object_id_dict[object_register_code][object_id_8bytes.toString()] = on_data_listener;
}

// [Flag]
WorkerGroup.prototype._degisterObjectIdOnData = function(object_register_code, object_id_8bytes) {
  delete this._on_data_object_register_code_object_id_dict[object_register_code][object_id_8bytes.toString()];
}

// [Flag]
WorkerGroup.prototype._sendWithObjectIdToGroupPeer = function(object_register_code, object_id_8bytes, group_peer_id, data_bytes, callback) {
  console.log(this._group_peer_tunnel_dict, group_peer_id);
  const object_register_code_byte = Buf.from([object_register_code]);
  // tunnel status
  // 0: not created
  // 1: creating
  // 2: created

  // Check if tunnel already created.
  if(this._group_peer_tunnel_dict[group_peer_id].status === 2) {
    this._sendWithObjectIdWithoutProtocolCodePrefix(object_register_code_byte, object_id_8bytes, group_peer_id, data_bytes, callback);
  }
  // Add to queue.
  else if(this._group_peer_tunnel_dict[group_peer_id].status === 1) {
    this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list.push([object_register_code_byte, object_id_8bytes, group_peer_id, data_bytes, callback]);
  }
  // Otherwise create it.
  else {
    this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list.push([object_register_code_byte, object_id_8bytes, group_peer_id, data_bytes, callback]);
    this._create_tunnel(group_peer_id, (error, tunnel)=> {
      if(error) {
        // Clear to be sent list
        const to_be_sent_list = this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list;
        this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list = [];
        to_be_sent_list.forEach((to_be_sent_informations) => {
          const _callback = to_be_sent_informations[4];
          _callback(error);
        });
        // Change status to not created.
        this._group_peer_tunnel_dict[group_peer_id].status = 0;
      }
      else {
        // Change status to created.
        this._setupTunnelWithObjectIdPrefix(group_peer_id, tunnel);
      }
    });
    // Change status to creating.
    this._group_peer_tunnel_dict[group_peer_id].status = 1;
  }
}

// Onetime data

// [Flag]
WorkerGroup.prototype._sendWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._multicastWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._broadcastWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._onDataWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// Request response

// [Flag]
WorkerGroup.prototype._requestResponseWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._multicastRequestResponseWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._broadcastRequestResponseWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._onRequestResponseWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// Handshake

// [Flag]
WorkerGroup.prototype._handshakeWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._multicastHandShakeWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._broadcastHandShakeWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// [Flag]
WorkerGroup.prototype._onHandShakeWithObjectId = function(object_register_code_byte, object_id_8bytes, callback) {

}

// Locker
// create by a group peer
WorkerGroup.prototype.createLocker = function(locker_name, locker_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeLocker = function(callback) {

}

// pause, destroy
// managed by Locker object itself.


// SyncQueue
// create by a group peer
WorkerGroup.prototype.createSyncQueue = function(sync_queue_name, sync_queue_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeSyncQueue = function(callback) {

}

// pause, destroy
// managed by SyncQueue object itself.


// AyncQueue
// create by a group peer
WorkerGroup.prototype.createAyncQueue = function(async_queue_name, async_queue_name_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeAyncQueue = function(callback) {

}

// pause, destroy
// managed by AyncQueue object itself.
// [Flag]
WorkerGroup.prototype.destroy = function(callback) {

}

// [Flag]
WorkerGroup.prototype.start = function(create_tunnel, on_tunnel_create, callback) {
  // Initiallize this._group_peer_tunnel_dict.
  for(let i = 0; i < this._group_peers_count; i++) {
    this._group_peer_tunnel_dict[i + 1] = {
      tunnel: null,
      status: 0,
      to_be_sent_list: []
    }
  }

  // Initiallize worker group objects.
  this._on_data_object_register_code_object_id_dict[Locker.register_code] = {};
  this._on_data_object_register_code_object_id_dict[SyncQueue.register_code] = {};
  this._on_data_object_register_code_object_id_dict[AsyncQueue.register_code] = {};

  // Initiallize on data.
  this._on_tunnel_create((group_peer_id, tunnel) => {
    console.log(group_peer_id);
    this._setupTunnelWithObjectIdPrefix(group_peer_id, tunnel);
  });

  console.log(123);
  this._registerObjectIdOnData(1, Buf.from([0x00, 0x01, 0x02, 0x01, 0x02, 0x01, 0x02, 0x02]), (group_peer_id, data)=> {
    console.log(group_peer_id, data);
  });

  this._sendWithObjectIdToGroupPeer(
    1,
    Buf.from([0x00, 0x01, 0x02, 0x01, 0x02, 0x01, 0x02, 0x02]),
    1,
    Buf.from([0x00, 0x01, 0x02]),
    (error) => {

    }
  );

  // this._create_tunnel(1, (error, tunnel)=> {
  //   console.log(error);
  //   tunnel.send(Buf.from([0x00, 0x01, 0x02]));
  // });
}

// [Flag]
WorkerGroup.prototype.close = function() {

}

// /**
//  * @memberof module:WorkerGroup
//  * @param {buffer} synchronize_information
//  * @return {buffer} synchronize_acknowledgement_information
//  * @description Synchronize handshake from remote emitter.
//  */
// WorkerGroup.prototype.synchronize = function(synchronize_information, onError, onAcknowledge, next) {
//
// }

/**
 * @callback module:WorkerGroup~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:WorkerGroup
 * @param {string} event_name
 * @param {module:WorkerGroup~callback_of_on} callback
 * @description Register event listener.
 */
WorkerGroup.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @memberof module:WorkerGroup
 * @param {string} event_name
 * @description WorkerGroup events emitter. For internal uses.
 */
WorkerGroup.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerGroup;

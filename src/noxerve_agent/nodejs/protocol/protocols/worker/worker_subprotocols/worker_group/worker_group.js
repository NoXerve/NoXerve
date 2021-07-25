/**
 * @file NoXerveAgent worker group file. [worker_group.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerGroup
 */

const Errors = require('../../../../../errors');
const Buf = require('../../../../../buffer');
const Channel = require('./channel');
const Variable = require('./objects/variable');

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
  this._global_deterministic_random_manager = settings.global_deterministic_random_manager;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._worker_global_protocol_codes = settings.worker_global_protocol_codes;

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
  this._group_peer_id_list = [];

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
   * @type {function}
   * @private
   */
  this._my_group_peer_id = settings.my_group_peer_id;

  /**
   * @memberof module:WorkerGroup
   * @type {function}
   * @private
   */
  this._hash_manager = settings.hash_manager;

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    'connections-broken': () => {}
  };

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
  this._on_data_channel_type_and_id_dict = {};

  /**
   * @memberof module:WorkerGroup
   * @type {object}
   * @private
   */
  this._worker_group_private_affair_channel = null;

  /**
   * @memberof module:WorkerGroup
   * @type {function}
   * @private
   */
  this._worker_group_private_affair_channel_on_data_listener = null;
  //
  // /**
  //  * @memberof module:WorkerGroup
  //  * @type {object}
  //  * @private
  //  */
  // this._worker_group_public_affair_channel = null;
  //
  // /**
  //  * @memberof module:WorkerGroup
  //  * @type {function}
  //  * @private
  //  */
  // this._worker_group_public_affair_channel_on_data_listener = null;
}

/**
 * @memberof module:WorkerGroupProtocol
 * @type {object}
 * @private
 */
WorkerGroup.prototype._ProtocolCodes = {
  worker_group_private_affair: Buf.from([0x00]),
  worker_group_public_affair: Buf.from([0x01]),
  channel: Buf.from([0x02])
};

// [Flag]
WorkerGroup.prototype._sendByGroupPeerId = function(group_peer_id, data_bytes, callback) {
  // tunnel status
  // 0: not created
  // 1: creating
  // 2: created

  // Check if tunnel already created.
  if(this._group_peer_tunnel_dict[group_peer_id].status === 2) {
    this._group_peer_tunnel_dict[group_peer_id].tunnel.send(data_bytes, callback);
  }
  // Add to queue.
  else if(this._group_peer_tunnel_dict[group_peer_id].status === 1) {
    this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list.push([group_peer_id, data_bytes, callback]);
  }
  // Otherwise create it.
  else {
    this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list.push([group_peer_id, data_bytes, callback]);
    this._emitTunnelCreation(group_peer_id);
  }
};

// [Flag]
WorkerGroup.prototype._setupTunnel = function(group_peer_id, tunnel) {
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
    const protocol_code = data[0];
    if(protocol_code === this._ProtocolCodes.channel[0]) {
      const channel_type_code_int = data[1];
      const channel_id_8bytes = data.slice(2, 10);
      const data_bytes = data.slice(10);
      this._on_data_channel_type_and_id_dict[channel_type_code_int + channel_id_8bytes.toString()](group_peer_id, data_bytes);
    }
  });

  // Start flushing to be sent list.
  const to_be_sent_list = this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list;
  // Clear to be sent list.
  this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list = [];

  // Change status.
  this._group_peer_tunnel_dict[group_peer_id].status = 2;

  to_be_sent_list.forEach((to_be_sent_informations) => {
    const _group_peer_id = to_be_sent_informations[0];
    const _data_bytes = to_be_sent_informations[1];
    const _callback = to_be_sent_informations[2];
    this._sendByGroupPeerId(_group_peer_id, _data_bytes, _callback);
  });


}

// [Flag]
WorkerGroup.prototype._emitTunnelCreation = function(group_peer_id) {
  // Change status to creating.
  this._group_peer_tunnel_dict[group_peer_id].status = 1;
  this._create_tunnel(group_peer_id, (error, tunnel)=> {
    if(error) {
      // Clear to be sent list
      const to_be_sent_list = this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list;
      this._group_peer_tunnel_dict[group_peer_id].to_be_sent_list = [];
      to_be_sent_list.forEach((to_be_sent_informations) => {
        const callback = to_be_sent_informations[2];
        callback(error);
      });
      // Change status to not created.
      this._group_peer_tunnel_dict[group_peer_id].status = 0;
    }
    else {
      // Change status to created.
      this._setupTunnel(group_peer_id, tunnel);
    }
  });

};

// // [Flag]
// WorkerGroup.prototype._destroyTunnel = function(group_peer_id) {
//   // this._group_peer_tunnel_dict[group_peer_id].tunnel = tunnel;
// }

// [Flag]
WorkerGroup.prototype._registerOnDataOfChannelTypeAndChannelId = function(channel_type_code_int, channel_id_8bytes, on_data_listener) {
  this._on_data_channel_type_and_id_dict[channel_type_code_int + channel_id_8bytes.toString()] = on_data_listener;
}

// [Flag]
WorkerGroup.prototype._unregisterOnDataOfChannelTypeAndChannelId = function(channel_type_code_int, channel_id_8bytes) {
  delete this._on_data_channel_type_and_id_dict[channel_type_code_int + channel_id_8bytes.toString()];
}

// [Flag]
WorkerGroup.prototype._sendByGroupPeerIdWithChannelTypeAndChannelId = function(channel_type_code_int, channel_id_8bytes, group_peer_id, data_bytes, callback) {
  const channel_type_code_int_byte = Buf.from([channel_type_code_int]);
  const decorated_data_bytes = Buf.concat([this._ProtocolCodes.channel, channel_type_code_int_byte, channel_id_8bytes, data_bytes]);
  this._sendByGroupPeerId(group_peer_id, decorated_data_bytes, callback);
}

// [Flag]
WorkerGroup.prototype._createChannel = function(channel_type_code_int, channel_id_8bytes, callback) {
  const channel = new Channel({
    send_by_group_peer_id: (group_peer_id, data_bytes, callback) => {
      this._sendByGroupPeerIdWithChannelTypeAndChannelId(channel_type_code_int, channel_id_8bytes, group_peer_id, data_bytes, callback);
    },
    register_on_data: (on_data_listener) => {
      this._registerOnDataOfChannelTypeAndChannelId(channel_type_code_int, channel_id_8bytes, on_data_listener);
    },
    unregister_on_data: ()=> {
      this._unregisterOnDataOfChannelTypeAndChannelId(channel_type_code_int, channel_id_8bytes);
    },
    return_my_group_peer_id: () => {
      return this._my_group_peer_id;
    },
    return_group_peer_id_list: () => {
      return this._group_peer_id_list;
    },
    group_peers_count: this._group_peers_count
  });

  callback(false, channel);
}

// [Flag]
WorkerGroup.prototype.start = function(callback) {

  // this._worker_group_private_affair_channel = new Channel({
  //   send_by_group_peer_id: (group_peer_id, data_bytes, callback) => {
  //   },
  //   register_on_data: (on_data_listener) => {
  //     this._worker_group_private_affair_channel_on_data_listener = on_data_listener;
  //   },
  //   unregister_on_data: ()=> {
  //     this._worker_group_private_affair_channel_on_data_listener = null;
  //   },
  //   return_my_group_peer_id: () => {
  //     return this._my_group_peer_id;
  //   },
  //   return_group_peer_id_list: () => {
  //     return this._group_peer_id_list;
  //   },
  //   group_peers_count: this._group_peers_count
  // });
  //
  // this._worker_group_public_affair_channel = new Channel({
  //   send_by_group_peer_id: (group_peer_id, data_bytes, callback) => {
  //   },
  //   register_on_data: (on_data_listener) => {
  //     this._worker_group_public_affair_channel_on_data_listener = on_data_listener;
  //   },
  //   unregister_on_data: ()=> {
  //     this._worker_group_public_affair_channel_on_data_listener = null;
  //   },
  //   return_my_group_peer_id: () => {
  //     return this._my_group_peer_id;
  //   },
  //   return_group_peer_id_list: () => {
  //     return this._group_peer_id_list;
  //   },
  //   group_peers_count: this._group_peers_count
  // });

  // Initiallize this._group_peer_tunnel_dict.
  for(let i = 0; i < this._group_peers_count; i++) {
    this._group_peer_tunnel_dict[i + 1] = {
      tunnel: null,
      status: 0,
      to_be_sent_list: []
    }
    this._group_peer_id_list.push(i + 1);
  }

  // Initiallize on data.
  this._on_tunnel_create((group_peer_id, tunnel) => {
    this._setupTunnel(group_peer_id, tunnel);
  });

  callback(false);
}

// [Flag]
WorkerGroup.prototype.createChannel = function(channel_id_8bytes, callback) {
  this._createChannel(0, channel_id_8bytes, (error, channel) => {
    if(error) callback(error);
    else {
      channel.start((error) => {
        callback(error, channel);
      });
    }
  })
}

// [Flag]
WorkerGroup.prototype.createVariable = function(locker_purpose_name, callback) {
  this._createChannel(Variable.register_code, this._hash_manager.hashString8Bytes(locker_purpose_name), (error, channel) => {
    if(error) callback(error);
    else {
      const variable = new (Variable.module)({
        channel: channel,
        nsdt_embedded_protocol: this._nsdt_embedded_protocol,
        random_seed_8_bytes: this._hash_manager.hashString8Bytes(locker_purpose_name),
        global_deterministic_random_manager: this._global_deterministic_random_manager,
        group_peers_count: this._group_peers_count,
        worker_global_protocol_codes: this._worker_global_protocol_codes,
        my_group_peer_id: this._my_group_peer_id
      });
      variable.start((error) => {
        callback(error, variable);
      });
    }
  })
}


// [Flag]
WorkerGroup.prototype.destroy = function(callback) {

}

// [Flag]
WorkerGroup.prototype.close = function(callback) {

}

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
  this._event_listener_dict[event_name] = callback;
}

/**
 * @memberof module:WorkerGroup
 * @param {string} event_name
 * @description WorkerGroup events emitter. For internal uses.
 */
WorkerGroup.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = WorkerGroup;

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
const Channel = require('./channel');

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
  this._group_peer_id_list = settings.group_peer_id_list;

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
  to_be_sent_list.forEach((to_be_sent_informations) => {
    const _group_peer_id = to_be_sent_informations[0];
    const _data_bytes = to_be_sent_informations[1];
    const _callback = to_be_sent_informations[2];
    this._sendByGroupPeerId(_group_peer_id, _data_bytes, _callback);
  });

  // Change status.
  this._group_peer_tunnel_dict[group_peer_id].status = 2;
}

// [Flag]
WorkerGroup.prototype._emitTunnelCreation = function(group_peer_id) {
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
  // Change status to creating.
  this._group_peer_tunnel_dict[group_peer_id].status = 1;
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
    return_group_peer_id_list: () => {
      return this._group_peer_id_list;
    },
    return_my_group_peer_id: () => {
      return this._my_group_peer_id;
    }
  });

  callback(false, channel);
}

// [Flag]
WorkerGroup.prototype.start = function(callback) {
  // Initiallize this._group_peer_tunnel_dict.
  for(let i = 0; i < this._group_peers_count; i++) {
    this._group_peer_tunnel_dict[i + 1] = {
      tunnel: null,
      status: 0,
      to_be_sent_list: []
    }
  }

  // Initiallize on data.
  this._on_tunnel_create((group_peer_id, tunnel) => {
    this._setupTunnel(group_peer_id, tunnel);
  });

  // Test
  this._createChannel(1, Buf.from([0x00, 0x01, 0x02, 0x01, 0x02, 0x01, 0x02, 0x02]), (error, channel) => {
    channel.start(() => {
      channel.on('data', (group_peer_id, data_bytes) => {
        console.log('data');
        console.log(group_peer_id, data_bytes);
      });
      channel.on('request-response', (group_peer_id, data_bytes, response) => {
        console.log('request');
        console.log(data_bytes);
        response(Buf.from([group_peer_id+1]));
      });
      channel.broadcast(Buf.from([0x00, 0x01, 0x02, 0x04]), (error, finished_group_peer_id_list) => {
        console.log(error, finished_group_peer_id_list);
      });
      channel.request(1, Buf.from([0x55]), (error, response_data_bytes) => {
        console.log('response');
        console.log(error, response_data_bytes);
      });

      channel.broadcastRequest(Buf.from([0x53]), (group_peer_id, error, response_data_bytes, next) => {
        console.log('response(broadcast)');
        console.log(group_peer_id, error, response_data_bytes);
        next(false, true);
      }, (error, finished_group_peer_id_list) => {
        console.log('broadcastRequest onfinish');
        console.log(error, finished_group_peer_id_list);
      });
    });
  });

  // callback(false);
}

// pause, destroy
// managed by AyncQueue object itself.
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

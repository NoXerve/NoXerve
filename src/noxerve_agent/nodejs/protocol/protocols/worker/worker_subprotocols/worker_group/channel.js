/**
 * @file NoXerveAgent channel file. [channel.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Channel
 */

const Errors = require('../../../../../errors');
const Buf = require('../../../../../buffer');

/**
 * @constructor module:Channel
 * @param {object} settings
 * @description NoXerveAgent worker group's Channel object.
 */


function Channel(settings) {
  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._send_by_group_peer_id = settings.send_by_group_peer_id;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._register_on_data = settings.register_on_data;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._unregister_on_data = settings.unregister_on_data;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._return_group_peer_id_list = settings.return_group_peer_id_list;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._event_listener_dict = {
    'data': (group_peer_id, data_bytes) => {

    },
    'request-response': (group_peer_id, data_bytes, response) => {

    },
    'handshake': () => {

    }
  };

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._enumerated_request_response_session_id = 0;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._response_listener_dict_of_request_response = {};

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._enumerated_handshake_session_id = 0;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._synchronize_acknowledgment_handler_dict_of_handshake = {};

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._acknowledgment_listener_dict_of_handshake = {};
}

Channel.prototype._ProtocolCodes = {
  onetime_data: Buf.from([0x00]),
  request_response_request: Buf.from([0x01]),
  request_response_response: Buf.from([0x02]),
  request_response_close: Buf.from([0x03]),
  handshake: Buf.from([0x04])
};


// [Flag]
Channel.prototype.start = function(callback) {
  this._register_on_data((group_peer_id, data)=> {
    console.log(group_peer_id, data);
    const protocol_code_int = data[0];
    const data_bytes = data.slice(1);
    if(protocol_code_int === this._ProtocolCodes.onetime_data[0]) {
      this._event_listener_dict['data'](group_peer_id, data_bytes);
    }
    else if (protocol_code_int === this._ProtocolCodes.request_response_request[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      this._event_listener_dict['request-response'](group_peer_id, data_bytes.slice(4), (response_data_bytes, inner_callback) => {
        if(Buf.isBuffer(response_data_bytes)) {
          this._send_by_group_peer_id(group_peer_id,
            Buf.concat([
            this._ProtocolCodes.request_response_response,
            session_id_4bytes,
            response_data_bytes
          ]), (error) => {
            if(inner_callback) inner_callback(error);
          });
        }
        else {
          // Is not buffer inform remote.
          this._send_by_group_peer_id(group_peer_id,
            Buf.concat([
            this._ProtocolCodes.request_response_close,
            session_id_4bytes
          ]), (error) => {
            if(inner_callback) inner_callback(error);
          });
        }
      });
    }
    else if (protocol_code_int === this._ProtocolCodes.request_response_response[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);
      this._response_listener_dict_of_request_response[session_id_int](false, data_bytes.slice(4));
      delete this._response_listener_dict_of_request_response[session_id_int];
    }
    else if (protocol_code_int === this._ProtocolCodes.request_response_close[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);
      this._response_listener_dict_of_request_response[session_id_int](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker group remote closed before responsed.'), null);
      delete this._response_listener_dict_of_request_response[session_id_int];
    }
    else if (protocol_code_int === this._ProtocolCodes.handshake[0]) {

    }
  });
  callback(false);
}


// [Flag]
Channel.prototype.close = function(callback) {
  this._unregister_on_data();
}

// Onetime data

// [Flag]
Channel.prototype.unicast = function(group_peer_id, data_bytes, callback) {
  this._send_by_group_peer_id(group_peer_id,
    Buf.concat([
    this._ProtocolCodes.onetime_data,
    data_bytes
  ]), callback);
}

// [Flag]
Channel.prototype.multicast = function(group_peer_id_list, data_bytes, callback) {
  let demultiplexing_callback_called_count = 0;
  let finished_group_peer_id_list = [];
  let error_dict = {};

  const demultiplexing_callback = (group_peer_id, error)=> {
    demultiplexing_callback_called_count ++;

    // Check if error, then append to list. Otherwise push to finished list.
    if(error) {
      error_dict[group_peer_id] = error;
    }
    else {
      finished_group_peer_id_list.push(group_peer_id);
    }

    // Check if should call the original callback or not.
    if(demultiplexing_callback_called_count === group_peer_id_list.length) {
      if(Object.keys(error_dict).length === 0) {
        error_dict = false;
      }
      callback(error_dict, finished_group_peer_id_list);
    }
  };

  // Sending messages.
  for(let index in group_peer_id_list) {
    const group_peer_id = group_peer_id_list[index];
    this.unicast(group_peer_id, data_bytes, (error) => {
      demultiplexing_callback(group_peer_id, error);
    });
  }
}

// [Flag]
Channel.prototype.broadcast = function(data_bytes, callback) {
  this.multicast(this._return_group_peer_id_list(), data_bytes, callback);
}

// Request response

// [Flag]
Channel.prototype._returnNewRequestSessionId = function() {
  const session_id = this._enumerated_request_response_session_id;
  this._enumerated_request_response_session_id += 1;
  return session_id;
}

// [Flag]
Channel.prototype.request = function(group_peer_id, request_data_bytes, on_group_peer_response) {
  const session_id_int = this._returnNewRequestSessionId();

  this._send_by_group_peer_id(group_peer_id,
    Buf.concat([
    this._ProtocolCodes.request_response_request,
    Buf.encodeUInt32BE(session_id_int),
    request_data_bytes
  ]), (error) => {
    if(error) {
      on_group_peer_response(error);
      return;
    }
    this._response_listener_dict_of_request_response[session_id_int] = on_group_peer_response;
  });
}

// [Flag]
Channel.prototype.multicastRequest = function(group_peer_id_list, request_data_bytes, a_group_peer_response_listener, finished_listener) {
  let demultiplexing_callback_called_count = 0;
  let finished_group_peer_id_list = [];
  let error_dict = {};

  const demultiplexing_callback = (group_peer_id, error, is_finished)=> {
    demultiplexing_callback_called_count ++;

    if (error) {
      error_dict[group_peer_id] = error;
    }
    if (is_finished) {
      finished_group_peer_id_list.push(group_peer_id);
    }

    // Check if should call the original callback or not.
    if(demultiplexing_callback_called_count === group_peer_id_list.length) {
      if(Object.keys(error_dict).length === 0) {
        error_dict = false;
      }
      finished_listener(error_dict, finished_group_peer_id_list);
    }
  };

  // Sending messages.
  for(let index in group_peer_id_list) {
    const group_peer_id = group_peer_id_list[index];
    this.request(group_peer_id, request_data_bytes, (error, response_data_bytes) => {
      a_group_peer_response_listener(group_peer_id, error, response_data_bytes, (error, is_finished) => {
        demultiplexing_callback(group_peer_id, error, is_finished);
      });
    });
  }
}

// [Flag]
Channel.prototype.broadcastRequest = function(request_data_bytes, a_group_peer_response_listener, finished_listener) {
  this.multicastRequest(this._return_group_peer_id_list(), request_data_bytes, a_group_peer_response_listener, finished_listener);
}


// Handshake

// [Flag]
Channel.prototype._returnNewHandshakeSessionId = function() {
  const session_id = this._enumerated_handshake_session_id;
  this._enumerated_session_id += 1;
  return session_id;
}

// [Flag]
Channel.prototype.handshake = function(group_peer_id, synchronize_data_bytes, synchronize_acknowledgment_handler, handshake_finished_listener) {
  const session_id_int = this._returnNewHandshakeSessionId();

  this._send_by_group_peer_id(group_peer_id,
    Buf.concat([
    this._ProtocolCodes.request_response_request,
    Buf.encodeUInt32BE(session_id_int),
    request_data_bytes
  ]), (error)=> {

  });
}

// [Flag]
Channel.prototype.multicastHandShake = function(callback) {

}

// [Flag]
Channel.prototype.broadcastHandShake = function(callback) {

}

/**
 * @callback module:Channel~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:Channel
 * @param {string} event_name
 * @param {module:Channel~callback_of_on} callback
 * @description Register event listener.
 */
Channel.prototype.on = function(event_name, callback) {
  this._event_listener_dict[event_name] = callback;
}

/**
 * @memberof module:Channel
 * @param {string} event_name
 * @description Channel events emitter. For internal uses.
 */
Channel.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = Channel;

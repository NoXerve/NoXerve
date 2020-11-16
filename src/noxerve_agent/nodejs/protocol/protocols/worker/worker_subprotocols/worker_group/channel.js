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
  this._group_peers_count = settings.group_peers_count;

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
  this._acknowledge_handler_dict_of_handshake = {};

  /**
   * @memberof module:Channel
   * @type {list}
   * @private
   */
  this._ready_list = [];

  /**
   * @memberof module:Channel
   * @type {list}
   * @private
   */
  this._return_group_peer_id_list = settings.return_group_peer_id_list;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._is_ready = false;

  /**
   * @memberof module:Channel
   * @type {object}
   * @private
   */
  this._get_ready_callback = null;
}

Channel.prototype._ProtocolCodes = {
  get_ready_request:  Buf.from([0x00]),
  get_ready_response:  Buf.from([0x01]),
  onetime_data: Buf.from([0x02]),
  request_response_request: Buf.from([0x03]),
  request_response_response: Buf.from([0x04]),
  request_response_error: Buf.from([0x05]),
  handshake_synchronize: Buf.from([0x06]),
  handshake_synchronize_acknowledgment: Buf.from([0x07]),
  handshake_acknowledge: Buf.from([0x08]),
  handshake_synchronize_error: Buf.from([0x09]),
  handshake_synchronize_acknowledgment_error: Buf.from([0x0a]),
};

Channel.prototype._return_group_peer_id_list = function() {
  if(!this._group_peer_id_list) {
    this._group_peer_id_list = [];
    for(let i = 1; i <= this._group_peers_count; i++) {
      this._group_peer_id_list.push(i);
    }
  }
  return this._group_peer_id_list;
}

Channel.prototype._setAGroupPeerReady = function(group_peer_id) {
  if(!this._is_ready) {
    this._ready_list[group_peer_id-1] = true;
    let is_ready = true;
    for(let index in this._ready_list) {
      if(!this._ready_list[index]) {
        is_ready = false;
        break;
      }
    }
    if(is_ready) {
      this._is_ready = true;
      this._get_ready_callback(false);
    }
  }
  // else {
  //   console.log('ready');
  // }
}

Channel.prototype._getReady = function(callback) {
  this._get_ready_callback = callback;

  for(let i = 1; i <= this._group_peers_count; i++) {
    const group_peer_id = i;
    this._send_by_group_peer_id(group_peer_id,
      Buf.concat([
      this._ProtocolCodes.get_ready_request
    ]), () => {
      // Do nothing.
    });
  }
}

// [Flag]
Channel.prototype.start = function(callback) {
  this._register_on_data((group_peer_id, data)=> {
    // console.log(group_peer_id, data);
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
            this._ProtocolCodes.request_response_error,
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
    else if (protocol_code_int === this._ProtocolCodes.request_response_error[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);
      this._response_listener_dict_of_request_response[session_id_int](new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Worker group remote closed before responsed.'), null);
      delete this._response_listener_dict_of_request_response[session_id_int];
    }
    else if (protocol_code_int === this._ProtocolCodes.handshake_synchronize[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);

      const synchronize_acknowledgment = (synchronize_acknowledgment_message_bytes, acknowledge_handler) => {
        // Is not buffer inform remote.
        this._send_by_group_peer_id(group_peer_id,
          Buf.concat([
          this._ProtocolCodes.handshake_synchronize_acknowledgment,
          session_id_4bytes,
          synchronize_acknowledgment_message_bytes
        ]), (error) => {
          if(error && acknowledge_handler) acknowledge_handler(error);
          if(!error) {
            this._acknowledge_handler_dict_of_handshake[group_peer_id+''+session_id_int] = acknowledge_handler;
          }
        });
      };

      this._event_listener_dict['handshake'](group_peer_id, data_bytes.slice(4), synchronize_acknowledgment);
    }
    else if (protocol_code_int === this._ProtocolCodes.handshake_synchronize_acknowledgment[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);
      const synchronize_acknowledgment_handler = this._synchronize_acknowledgment_handler_dict_of_handshake[session_id_int];
      if(synchronize_acknowledgment_handler) {
        const acknowledge = (acknowledge_message_bytes, acknowledge_callback) => {
          if(Buf.isBuffer(acknowledge_message_bytes)) {
            this._send_by_group_peer_id(group_peer_id,
              Buf.concat([
              this._ProtocolCodes.handshake_acknowledge,
              session_id_4bytes,
              acknowledge_message_bytes
            ]), acknowledge_callback);
          } else if(acknowledge_callback) {
            if(acknowledge_message_bytes === false) acknowledge_callback(false);
            else acknowledge_callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Channel acknowledge error: acknowledge_message_bytes is invalid.'));
            // Is not buffer inform remote.
            this._send_by_group_peer_id(group_peer_id,
              Buf.concat([
              this._ProtocolCodes.handshake_synchronize_acknowledgment_error,
              session_id_4bytes,
            ]));
          } else {
            this._send_by_group_peer_id(group_peer_id,
              Buf.concat([
              this._ProtocolCodes.handshake_synchronize_acknowledgment_error,
              session_id_4bytes,
            ]));
          }
        };
        synchronize_acknowledgment_handler(false, data_bytes.slice(4), acknowledge);
      }
      delete this._synchronize_acknowledgment_handler_dict_of_handshake[session_id_int];
    }
    else if (protocol_code_int === this._ProtocolCodes.handshake_acknowledge[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);
      const acknowledge_handler = this._acknowledge_handler_dict_of_handshake[group_peer_id+''+session_id_int];
      if(acknowledge_handler) {
        acknowledge_handler(false, data_bytes.slice(4));
      }
      delete this._acknowledge_handler_dict_of_handshake[group_peer_id+''+session_id_int];
    }
    else if (protocol_code_int === this._ProtocolCodes.handshake_synchronize_acknowledgment_error[0]) {
      const session_id_4bytes = data_bytes.slice(0, 4);
      const session_id_int = Buf.decodeUInt32BE(session_id_4bytes);
      const acknowledge_handler = this._acknowledge_handler_dict_of_handshake[group_peer_id+''+session_id_int];
      if(acknowledge_handler) {
        acknowledge_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('Channel synchronize acknowledgment error called by remote.'));
      }
      delete this._acknowledge_handler_dict_of_handshake[group_peer_id+''+session_id_int];
    }
    else if (protocol_code_int === this._ProtocolCodes.get_ready_request[0]) {
      this._setAGroupPeerReady(group_peer_id);
      this._send_by_group_peer_id(group_peer_id,
        Buf.concat([
        this._ProtocolCodes.get_ready_response
      ]), () => {
        // Do nothing.
      });
    }
    else if (protocol_code_int === this._ProtocolCodes.get_ready_response[0]) {
      this._setAGroupPeerReady(group_peer_id);
    }
  });

  // Initialize ready list.
  for(let i = 1; i <= this._group_peers_count; i++) {
    this._ready_list.push(false);
  }

  this._getReady(callback);
}


// [Flag]
Channel.prototype.close = function(callback) {
  this._unregister_on_data();
}

// Onetime data

// [Flag]
Channel.prototype.unicast = function(group_peer_id, data_bytes, callback) {
  if(!Buf.isBuffer(data_bytes)) {synchronize_acknowledgment_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('data_bytes must be buffer.')); return;};
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
  if(!Buf.isBuffer(request_data_bytes)) {synchronize_acknowledgment_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('request_data_bytes must be buffer.')); return;};
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
      const comfirm_error_finish_status = (error, is_finished) => {
        demultiplexing_callback(group_peer_id, error, is_finished);
      }
      a_group_peer_response_listener(group_peer_id, error, response_data_bytes, comfirm_error_finish_status);
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
  this._enumerated_handshake_session_id += 1;
  return session_id;
}

// [Flag]
Channel.prototype.synchronize = function(group_peer_id, synchronize_data_bytes, synchronize_acknowledgment_handler) {
  if(!Buf.isBuffer(synchronize_data_bytes)) {synchronize_acknowledgment_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER_SUBPROTOCOL_WORKER_GROUP('synchronize_data_bytes must be buffer.')); return;};
  const session_id_int = this._returnNewHandshakeSessionId();

  this._send_by_group_peer_id(group_peer_id,
    Buf.concat([
    this._ProtocolCodes.handshake_synchronize,
    Buf.encodeUInt32BE(session_id_int),
    synchronize_data_bytes
  ]), (error)=> {
    if(error) {
      synchronize_acknowledgment_handler(error);
    }
    else {
      this._synchronize_acknowledgment_handler_dict_of_handshake[session_id_int] = synchronize_acknowledgment_handler;
    }
  });
}

// [Flag]
Channel.prototype.multicastSynchronize = function(group_peer_id_list, synchronize_data_bytes, a_synchronize_acknowledgment_handler, synchronize_acknowledgment_finished_listener, acknowledge_finished_listener) {
  let synchronize_error_dict = {};
  let synchronize_acknowledgment_status_dict = {};
  let finished_synchronize_group_peer_acknowledge_dict = {};
  let acknowledge_error_dict = {};
  let finished_acknowledge_group_peer_id_list = [];

  let synchronize_acknowledgment_status_count = 0;

  let acknowledge_count = 0;
  let finished_synchronize_group_peer_count = 0;

  for(let index in group_peer_id_list) {
    const group_peer_id = group_peer_id_list[index];
    this.synchronize(group_peer_id, synchronize_data_bytes, (synchronize_error, synchronize_acknowledgment_message_bytes, acknowledge)=> {
      if(synchronize_error) {
        synchronize_error_dict[group_peer_id] = synchronize_error;
      }
      else {
        finished_synchronize_group_peer_acknowledge_dict[group_peer_id] = (acknowledge_message_bytes) => {
          acknowledge(acknowledge_message_bytes, (error) => {
            acknowledge_count++;
            if(error) {
              acknowledge_error_dict[group_peer_id] = error;
            }
            else {
              finished_acknowledge_group_peer_id_list.push(group_peer_id);
            }
            if(acknowledge_count === finished_synchronize_group_peer_count) {
              if(Object.keys(acknowledge_error_dict).length === 0) {
                acknowledge_error_dict = false;
              }
              acknowledge_finished_listener(acknowledge_error_dict, finished_acknowledge_group_peer_id_list);
            }
          });
        };
      }
      const register_synchronize_acknowledgment_status = (synchronize_acknowledgment_status) => {
        synchronize_acknowledgment_status_dict[group_peer_id] = synchronize_acknowledgment_status;
        synchronize_acknowledgment_status_count ++;

        if(synchronize_acknowledgment_status_count === group_peer_id_list.length) {
          if(Object.keys(synchronize_error_dict).length === 0) {
            synchronize_error_dict = false;
          }
          finished_synchronize_group_peer_count = Object.keys(finished_synchronize_group_peer_acknowledge_dict).length;
          synchronize_acknowledgment_finished_listener(synchronize_error_dict, finished_synchronize_group_peer_acknowledge_dict, synchronize_acknowledgment_status_dict);
        }
      };
      a_synchronize_acknowledgment_handler(group_peer_id, synchronize_error, synchronize_acknowledgment_message_bytes, register_synchronize_acknowledgment_status);
    });
  }
}

// [Flag]
Channel.prototype.broadcastSynchronize = function(synchronize_data_bytes, a_synchronize_acknowledgment_handler, synchronize_acknowledgment_finished_listener, acknowledge_finished_listener) {
  this.multicastSynchronize(this._return_group_peer_id_list(), synchronize_data_bytes, a_synchronize_acknowledgment_handler, synchronize_acknowledgment_finished_listener, acknowledge_finished_listener);
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

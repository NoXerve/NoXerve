/**
 * @file NoXerveAgent virtualnet file. [virtualnet.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

const Errors = require('../errors');

function SocketPair() {

  this.SocketAlpha = {
    closed: false,
    event_listeners: {},
    send: (data_bytes, callback) => {
      if (this.SocketAlpha.closed) {
        if(callback) callback(new Errors.ERR_NOXERVEAGENT_NODE_VIRTUALNET('Socket closed already.'));
      }
      else {
        process.nextTick(() => {
          this.SocketBeta.event_listeners.message(data_bytes);
        }, 0);

        if(callback) callback(false);
      }
    },
    close: (callback) => {
      if (this.SocketAlpha.closed) {
        if(callback) callback(new Errors.ERR_NOXERVEAGENT_NODE_VIRTUALNET('Socket closed already.'));
      }
      else {
        this.SocketAlpha.event_listeners.close();
        this.SocketBeta.event_listeners.close();
        if(callback) callback(false);
      }

    },
    on: (event_name, listener) => {
      this.SocketAlpha.event_listeners[event_name] = listener;
    }
  };

  this.SocketBeta = {
    closed: false,
    event_listeners: {},
    send: (data_bytes, callback) => {
      if (this.SocketBeta.closed) {
        if(callback) callback(new Errors.ERR_NOXERVEAGENT_NODE_VIRTUALNET('Socket closed already.'));
      }
      else {
        process.nextTick(() => {
          this.SocketAlpha.event_listeners.message(data_bytes);
        }, 0);

        if(callback) callback(false);
      }
    },
    close: (callback) => {
      if (this.SocketBeta.closed) {
        if(callback) callback(new Errors.ERR_NOXERVEAGENT_NODE_VIRTUALNET('Socket closed already.'));
      }
      else {
        this.SocketAlpha.event_listeners.close();
        this.SocketBeta.event_listeners.close();
        if(callback) callback(false);
      }
    },
    on: (event_name, listener) => {
      this.SocketBeta.event_listeners[event_name] = listener;
    }
  };
}

function Virtualnet() {
  this.Server = {
    clients: {},
    event_listeners: {},
    on: (event_name, callback) => {
      this.Server.event_listeners[event_name] = callback
    },
    close: (callback) => {
      for(let i in this.Server.clients) {
        this.Server.clients[i].close();
      }
      this.Server.clients = {};
      callback(false);
    }
  };

  this.Client = {
    connect: (callback) => {
      const socket_pair = new SocketPair();
      const server_socket = socket_pair.SocketAlpha;
      const client_socket = socket_pair.SocketBeta;

      // trigger server and return server socket
      this.Server.event_listeners.connection(server_socket);
      // return virtual client socket to callback
      callback(false, client_socket);
    }
  };
}

module.exports = Virtualnet;

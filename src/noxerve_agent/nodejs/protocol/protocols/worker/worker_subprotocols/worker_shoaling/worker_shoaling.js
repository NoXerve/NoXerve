/**
 * @file NoXerveAgent worker shoaling manager index file. [index.js]
 * @author idoleat <dppss92132@gmail.com>
 */

'use strict';

 /**
  * @module WorkerShoaling
  */

const Errors = require('../../../../../errors');

function WorkerShoaling(settings){
  /**
    * @memberof module:WorkerShoaling
    * @type {object}
    * @private
    */
  this._settings = settings;

  this._event_listener_dict = {
    'test' : (param) => {console.log("YEAH! THIS IS WORKER SHOALING!!");}
  }

  this.shoaling_peer_id_list = [];
}

WorkerShoaling.prototype.getPeerWorkerIDList = function(){
  return this.shoaling_peer_id_list;
}

// Advanced functionality

WorkerShoaling.prototype.createWorkerSocket = function() {}

WorkerShoaling.prototype.onWorkerSocketCreate = function() {}

WorkerShoaling.prototype.createWorkerScope = function() {}

WorkerShoaling.prototype.createWorkerGroup = function() {}

WorkerShoaling.prototype.createWorkerShoaling = function() {}

// Basic functionality

WorkerShoaling.prototype.joinMe = function() {}

WorkerShoaling.prototype.updateMe = function() {}

WorkerShoaling.prototype.leaveMe = function() {}

WorkerShoaling.prototype.leaveWorkerPeer = function() {}

WorkerShoaling.prototype.abandonWorkerPeers = function() {}

WorkerShoaling.prototype.getWorkerPeerDetail = function() {}

WorkerShoaling.prototype.getAllWorkerPeersSettings = function() {}

WorkerShoaling.prototype.getGlobalDeterministicRandomManager = function() {}

WorkerShoaling.prototype.importMyWorkerAuthenticityData = function() {}

WorkerShoaling.prototype.importStaticGlobalRandomSeed = function() {}

WorkerShoaling.prototype.importWorkerPeersSettings = function() {}

// event

WorkerShoaling.prototype.on = function(event_name, event_listener){
  this._event_listener_dict[event_name] = event_listener;
}

WorkerShoaling.prototype.emitEventListener = function(event_name, ...params){
  return this._event_listener_dict[event_name].apply(null, params);
}

module.exports = WorkerShoaling;

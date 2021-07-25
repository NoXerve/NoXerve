/**
 * @file NoxServiceSystem service manager index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 */

 'use strict';

/**
 * @module ServiceManager
 */

 // const Tar = require('tar');
 const Zlib = require('zlib');
 const fs = require('fs');

function ServiceManager(settings) {
  this._noxerve_agent_worker = settings.noxerve_agent_worker;
  this._worker_affair_manager = settings.worker_affair_manager;
  this._stable_worker_list = [];
}

ServiceManager.prototype.installService = function(service_manifest, service_package_tar_gz_readable_stream, callback) {
  let writeStream = fs.createWriteStream('test.txt');
  let on_finish_called = false;
  const on_finish = () => {
    console.log('uploaded.');
    callback(false);
  };
  service_package_tar_gz_readable_stream.pipe(writeStream).on('finish', on_finish);
  // register_service_package_tar_gz_readable_stream();
}

ServiceManager.prototype.startService = function() {

}

ServiceManager.prototype.closeService = function() {

}

ServiceManager.prototype.restartService = function() {

}

ServiceManager.prototype.start = function(callback) {
  this._worker_affair_manager.onWorkerPeerJoin();
  this._worker_affair_manager.onWorkerPeerUpdate();
  this._worker_affair_manager.onWorkerPeerLeave();

  // this._noxerve_agent_worker.GlobalDeterministicRandomManager.generateIntegerInRange(Buffer.from([0x02]), 0, 100, (error, result) => {
  //   console.log(result);
  // });

  this._noxerve_agent_worker.getAllWorkerPeersSettings((error, worker_peer_settings_dict) => {
    if(error) {callback(error); return;}
    // Generate stable worker list
    // console.log(worker_peer_settings_dict);
    // this._noxerve_agent_worker.createWorkerGroup('core_worker_group', [1], (error, worker_group) => {
    //   if(error) {callback(error); return;}
    //   worker_group.createVariable('service_dict', (error, service_list_group_var) => {
    //     if(error) {callback(error); return;}
    //     worker_group.createVariable('worker_room_dict', (error, service_list_group_var) => {
    //       if(error) {callback(error); return;}
          callback(false);
    //     });
    //   });
    // });
  });

}

module.exports = ServiceManager;

/**
 * @file NoxServiceSystem service manager index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

 'use strict';

/**
 * @module ServiceManager
 */

 // const Tar = require('tar');
 const Zlib = require('zlib');
 const fs = require('fs');

function ServiceManager(settings) {

  this._worker_module = settings.worker_module;

}

ServiceManager.prototype.installService = function(service_package_tar_gz_readable_stream, callback) {
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

module.exports = ServiceManager;

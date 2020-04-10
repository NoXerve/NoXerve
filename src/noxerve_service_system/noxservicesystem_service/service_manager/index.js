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

function ServiceManager(settings) {

  this._worker_module = settings.worker_module;
  
}

ServiceManager.prototype.startService = function() {

}

ServiceManager.prototype.closeService = function() {

}

ServiceManager.prototype.restartService = function() {

}

module.exports = ServiceManager;

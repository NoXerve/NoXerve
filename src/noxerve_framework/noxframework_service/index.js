/**
 * @file NoxFramework Service index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module NoxFrameworkService
 */

function NoxFrameworkService(noxerve_agent, preloader_parameters) {
  this._noxerve_agent = noxerve_agent;
  this._preloader_parameters = preloader_parameters;
}

NoxFrameworkService.prototype.start = function(next) {
  console.log('NoxFrameworkService started.');
  next();
  setTimeout(()=> {
    this._preloader_parameters.closePreloader()
  }, 300);
}

NoxFrameworkService.prototype.close = function(next) {
  console.log('NoxFrameworkService closed.');

  next();
}

module.exports = NoxFrameworkService;

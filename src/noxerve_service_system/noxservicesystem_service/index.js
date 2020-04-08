/**
 * @file NoxServiceSystem Service index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module NoxServiceSystemService
 */

const FS = require('fs');
const Initializer = require('./initializer');

function NoxServiceSystemService(noxerve_agent, preloader_parameters) {
  this._noxerve_agent = noxerve_agent;
  this._preloader_parameters = preloader_parameters;
}

NoxServiceSystemService.prototype.start = function(finish_start) {
  console.log('NoxServiceSystem Service started.');

  const if_error_close_preloader = (error, next) => {
    if(error) {
      finish_start();
      console.log(error);
      setTimeout(() => {this._preloader_parameters.closePreloader()}, 100);
    }
    else {
      next();
    }
  };

  // Initialize.
  const initailize_noxerve_agent_worker = () => {
    Initializer.initailizeNoXerveAgentWorker(this._noxerve_agent, this._preloader_parameters, (error) => {
      if_error_close_preloader(error, ()=> {

      });
    });
  };

  if(Initializer.isMyWorkerFilesInitailized()) {
    this._noxerve_agent.start((error) => {
      if_error_close_preloader(error, ()=> {
        initailize_noxerve_agent_worker();
      });
    });
  }
  else {
    console.log('NoxServiceSystem Service files not initailized. Initializing...');
    Initializer.initailizeMyWorkerFiles(this._noxerve_agent, this._preloader_parameters, (error) => {
      if_error_close_preloader(error, ()=> {
        console.log('NoxServiceSystem Service files Initialized.');
        this._noxerve_agent.start((error) => {
          if_error_close_preloader(error, ()=> {
            initailize_noxerve_agent_worker();
          });
        });
      });
    });
  }

}

NoxServiceSystemService.prototype.close = function(finish_close) {
  console.log('NoxServiceSystem Service closed.');
  finish_close();
}

module.exports = NoxServiceSystemService;

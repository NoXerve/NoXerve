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
const Manifest = require('./manifest.json');


function NoxServiceSystemService(noxerve_agent, preloader_parameters) {
  this._noxerve_agent = noxerve_agent;
  this._preloader_parameters = preloader_parameters;
}

NoxServiceSystemService.prototype.start = function(finish_start) {
  console.log(Manifest.service_display_name + ' service(version ' + Manifest.service_version + ') worker started.');
  console.log(Manifest.service_description);

  const if_error_then_close_preloader = (error, next) => {
    if (error) {
      finish_start();
      console.log(error);
      setTimeout(() => {
        this._preloader_parameters.closePreloader()
      }, 100);
    } else {
      next();
    }
  };

  // Initialize.
  const initailize_noxerve_agent_worker = (next) => {
    Initializer.initailizeNoXerveAgentWorker(this._noxerve_agent, this._preloader_parameters, (error) => {
      if_error_then_close_preloader(error, () => {
        next(false);
      });
    });
  };

  const worker_setup = () => {

  };

  const service_setup = (next) => {
    this._noxerve_agent.Service.onActivityCreate('default', (parameter, service_of_activity) => {
      const service_manager_callable_struture = NoXerveAgent.NSDT.createCallableStructure({
        installService: (service_package_zip_bytes_streamer, callback) => {},
        uninstallService: (service_id, callback) => {},
        getServiceStatus: (service_id, callback) => {},
        startService: (service_id, callback) => {},
        closeService: (service_id, callback) => {},
        deployWorkerOfService: (service_id, host_id, platfrom_name, callback) => {},
        undeployWorkerOfService: (service_id, worker_id, callback) => {},
      });

      service_of_activity.define('getServiceManager', (service_function_parameter, return_data, yield_data) => {
        // Need authentication.
        return_data(service_manager_callable_struture);
      });

      service_of_activity.define('', (service_function_parameter, return_data, yield_data) => {

      });
    });
    // console.log('123');
    next(false);
  };

  const start_normally_setting_up = () => {
    this._noxerve_agent.start((error) => {
      if_error_then_close_preloader(error, () => {
        //
        initailize_noxerve_agent_worker((error) => {
          if_error_then_close_preloader(error, () => {
            //
            service_setup((error) => {
              if_error_then_close_preloader(error, finish_start);
            });
          });
        });
      });
    });
  };

  // Initializing.
  if (Initializer.isMyWorkerFilesInitailized()) {
    start_normally_setting_up();
  } else {
    console.log('NoxServiceSystem Service files not initailized. Initializing...');
    Initializer.initailizeMyWorkerFiles(this._noxerve_agent, this._preloader_parameters, (error) => {
      if_error_then_close_preloader(error, () => {
        console.log('NoxServiceSystem Service files Initialized.');
        start_normally_setting_up();
      });
    });
  }

}

NoxServiceSystemService.prototype.close = function(finish_close) {
  console.log('NoxServiceSystem service worker closed.');
  finish_close();
}

module.exports = NoxServiceSystemService;

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
const ServiceManager = require('./service_manager');
const Manifest = require('./manifest.json');
const Stream = require('stream');

const CustomReadable = function(options) {
  Stream.Readable.call(this, options);
  this._read_custom = options._read_custom;
};

//Inherit prototype
CustomReadable.prototype = Object.create(Stream.Readable.prototype);
CustomReadable.prototype.constructor = Stream.Readable;

CustomReadable.prototype._read = function(size) {
  this._read_custom(size, this.push.bind(this));
};

function NoxServiceSystemService(noxerve_agent, preloader_parameters) {
  this._noxerve_agent = noxerve_agent;
  this._preloader_parameters = preloader_parameters;
}

NoxServiceSystemService.prototype.start = function(finish_start) {
  console.log(Manifest.service_display_name + ' service(version ' + Manifest.service_version + ') worker started.');
  console.log(Manifest.service_description);

  const if_error_then_close_preloader = (error, next, tips) => {
    if (error) {
      // finish_start();
      console.log(error);
      if(tips) console.log(tips);
      setTimeout(() => {
        this._preloader_parameters.terminatePreloader()
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

  const service_manager_setup = (next) => {
    this._service_manager = new ServiceManager({
      preloader_parameters: this._preloader_parameters
    });
    next(false);
  };

  const service_setup = (next) => {
    const user_space_service_activity_create_handler = (parameter, service_of_activity) => {

    };

    this._noxerve_agent.Service.onActivityCreate('default', user_space_service_activity_create_handler);
    this._noxerve_agent.Service.onActivityCreate('user_space_service', user_space_service_activity_create_handler);
    this._noxerve_agent.Service.onActivityCreate('system_space_service', (parameter, service_of_activity) => {
      const service_id = parameter.service_id;
      const worker_id = parameter.worker_id;
      const system_space_service_token = parameter.system_space_service_token;

      const service_manager_callable_struture = NoXerveAgent.NSDT.createCallableStructure({
        installService: (service_package_tar_gz_readable_stream_callable_structure, callback) => {
          const service_package_tar_gz_readable_stream = new CustomReadable({
            _read_custom: (bytes_size, push) => {
              service_package_tar_gz_readable_stream_callable_structure.call('read_bytes', bytes_size, push);
            }
          });

          this._service_manager.installService(service_package_tar_gz_readable_stream, callback);
        },
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

      service_of_activity.define('authenticateSystemSpaceServiceToken', (service_function_parameter, return_data, yield_data) => {

      });

      service_of_activity.define('getNSSystemWorkerAuthenticityToken', (service_function_parameter, return_data, yield_data) => {

      });

    });
    this._noxerve_agent.Service.onActivityCreate('cli', (parameter, service_of_activity)=> {
      service_of_activity.define('getAddNewWorkerCode', (service_function_parameter, return_data, yield_data) => {
        Initializer.getAddNewWorkerCode((error, add_new_worker_code) => {
          return_data({
            error: error,
            add_new_worker_code: add_new_worker_code
          });
        });
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

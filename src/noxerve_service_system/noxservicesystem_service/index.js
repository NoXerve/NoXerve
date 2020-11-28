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
const WorkerAffairManager = require('./worker_affair_manager');
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

  this._worker_affair_manager = new WorkerAffairManager({
    noxerve_agent_worker: noxerve_agent.Worker
  });

  this._service_manager = new ServiceManager({
    noxerve_agent_worker: noxerve_agent.Worker,
    worker_affair_manager: this._worker_affair_manager
  });
}

NoxServiceSystemService.prototype.start = function(finish_start) {
  console.log(Manifest.service_display_name + ' service(version ' + Manifest.service_version + ') worker started.');
  console.log(Manifest.service_description);


  // Cabinet Commission

  this._noxerve_agent.Worker.onWorkerSocketCreate('CabinetCommissionQuery', (parameters, remote_worker_id, worker_socket) => {
    worker_socket.define('joinDepartments',  (worker_socket_function_parameter, return_data, yield_data) => {

    });

    worker_socket.define('isWorkerInDepartment',  (worker_socket_function_parameter, return_data, yield_data) => {

    });

    worker_socket.define('whoIsInDepartment',  (worker_socket_function_parameter, return_data, yield_data) => {

    });
  });

  this._noxerve_agent.Worker.onWorkerSocketCreate('CabinetCommissionAssignment', (parameters, remote_worker_id, worker_socket) => {
    // worker_socket.define('getServiceStatus',  (service_function_parameter, return_data, yield_data) => {
    //
    // });
  });


  // Foreign Services Affair

  this._noxerve_agent.Worker.onWorkerSocketCreate('ForeignServicesAffairQuery', (parameters, remote_worker_id, worker_socket) => {
    worker_socket.define('getServiceStatus',  (worker_socket_function_parameter, return_data, yield_data) => {

    });

    worker_socket.define('getServiceStatus',  (worker_socket_function_parameter, return_data, yield_data) => {

    });
  });
  this._noxerve_agent.Worker.onWorkerSocketCreate('ForeignServicesAffairAssignment', (parameters, remote_worker_id, worker_socket) => {

  });


  // Foreign Workers Affair

  this._noxerve_agent.Worker.onWorkerSocketCreate('ForeignWorkersAffairQuery', (parameters, remote_worker_id, worker_socket) => {
    worker_socket.define('getServiceStatus',  (worker_socket_function_parameter, return_data, yield_data) => {

    });
  });

  this._noxerve_agent.Worker.onWorkerSocketCreate('ForeignWorkersAffairAssignment', (parameters, remote_worker_id, worker_socket) => {
    worker_socket.define('installWorkerOfService',  (worker_socket_function_parameter, return_data, yield_data) => {
      // Check worker room avaliable.
    });
  });


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
    this._worker_affair_manager.initailizeNoXerveAgentWorker(this._noxerve_agent, this._preloader_parameters, (error) => {
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
    const service_manager_callable_struture = this._noxerve_agent.NSDT.createCallableStructure({
      startService: (service_id, callback) => {},
      closeService: (service_id, callback) => {},
      installService: (service_manifest, service_package_tar_gz_readable_stream_callable_structure, callback) => {
        const service_package_tar_gz_readable_stream = new CustomReadable({
          _read_custom: (bytes_size, push) => {
            service_package_tar_gz_readable_stream_callable_structure.call('read_bytes', bytes_size, push);
          }
        });

        this._service_manager.installService(service_manifest, service_package_tar_gz_readable_stream, callback);
      },
      uninstallService: (service_id, callback) => {},
      getServiceStatus: (service_id, callback) => {},

      getAllServiceStatus: (service_id, callback) => {},
      getWorkerRoomStatus: (worker_room_id) => {

      },
      getAllWorkerRoomsStatus: () => {

      },
      deployWorkerOfService: (service_id, worker_room_id, callback) => {},
      undeployWorkerOfService: (worker_room_id, callback) => {},
    });

    const user_space_service_activity_create_handler = (parameter, service_of_activity) => {

    };

    this._noxerve_agent.Service.onActivityCreate('default', user_space_service_activity_create_handler);
    this._noxerve_agent.Service.onActivityCreate('user_space_service', user_space_service_activity_create_handler);
    this._noxerve_agent.Service.onActivityCreate('system_space_service', (parameter, service_of_activity) => {
      const service_id = parameter.service_id;
      const worker_id = parameter.worker_id;
      const system_space_service_token = parameter.system_space_service_token;

      service_of_activity.define('getServiceManager', (service_function_parameter, return_data, yield_data) => {
        // Need authentication.
        this._noxerve_agent.Worker.createWorkerSocket('ForeignWorkersAffairQuery', (error, worker_socket) => {
          worker_socket.define('getServiceStatus',  (service_function_parameter, return_data, yield_data) => {

          });
        });
        return_data(service_manager_callable_struture);
      });

      service_of_activity.define('authenticateSystemSpaceServiceToken', (service_function_parameter, return_data, yield_data) => {

      });

      service_of_activity.define('getNSSystemWorkerAuthenticityToken', (service_function_parameter, return_data, yield_data) => {

      });

      service_of_activity.define('getJoinNewWorkerCode', (service_function_parameter, return_data, yield_data) => {
        this._worker_affair_manager.getJoinNewWorkerCode((error, add_new_worker_code) => {
          return_data({
            error: error,
            add_new_worker_code: add_new_worker_code
          });
        });
      });

    });
    this._noxerve_agent.Service.onActivityCreate('cli', (parameter, service_of_activity)=> {
      service_of_activity.define('getJoinNewWorkerCode', (service_function_parameter, return_data, yield_data) => {
        this._worker_affair_manager.getJoinNewWorkerCode((error, add_new_worker_code) => {
          return_data({
            error: error,
            add_new_worker_code: add_new_worker_code
          });
        });
      });

      service_of_activity.define('getServiceManager', (service_function_parameter, return_data, yield_data) => {
        // Need authentication.
        return_data(service_manager_callable_struture);
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
            this._service_manager.start((error) => {
              if_error_then_close_preloader(error, () => {
                //
                service_setup((error) => {
                  if_error_then_close_preloader(error, finish_start);
                });
              })
            });
          });
        });
      });
    });
  };

  // Initializing.
  if (this._worker_affair_manager.isMyWorkerFilesInitailized()) {
    start_normally_setting_up();
  } else {
    console.log('NoxServiceSystem Service files not initailized. Initializing...');
    this._worker_affair_manager.initailizeMyWorkerFiles(this._noxerve_agent, this._preloader_parameters, (error) => {
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

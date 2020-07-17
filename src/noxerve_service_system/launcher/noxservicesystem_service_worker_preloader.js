/**
 * @file NoxServiceSystem service preloader file. [noxservicesystem.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

process.title = 'NoXerve Framework service';

console.log('');
console.log('');
console.log('88d888b. .d8888b. .d8888b. dP.  .dP 8b     88\' TM');
console.log('88\'  `88 88\'  `88 88\'  `88  `8bd8\'  `8b   88\'');
console.log('88    88 88.  .88 88.  .88  .d88b.   `8b d8\'');
console.log('dP    dP `88888P\' `88888P\' dP\'  `dP   `88P\'');
console.log('                                       d8\'');
console.log('                                    888P\'');
console.log('');
console.log('NoXerveServiceSystem');
console.log('© 2020 nooxy org. All right reserved.');
console.log('');

console.log('NoxServiceSystem service worker process id: ' + process.pid);
const message_codes = {
  start_noxservicesystem_service: 0x01,
  start_noxservicesystem_service_comfirm: 0x02,
  close_noxservicesystem_service: 0x03,
  close_noxservicesystem_service_comfirm: 0x04,
  terminate_noxservicesystem_service: 0x05,
  request_preloader_close: 0xff,
  request_preloader_terminate: 0xfe,
  request_preloader_relaunch: 0xfd
}

const NoxServiceSystemService = require('../noxservicesystem_service');
const FS = require('fs');
const {
  execSync
} = require("child_process");

let noxservicesystem_service_instance;

process.on('message', (message) => {
  const message_code = message.message_code;
  const data = message.data;

  if (message_code === message_codes.close_noxservicesystem_service) {
    let close_executed_next_execute = 0;
    const close_executed_next_execute_plus_one = () => {
      close_executed_next_execute++;
      if (close_executed_next_execute === 2) {
        process.send({
          message_code: message_codes.close_noxservicesystem_service_comfirm
        });
      }
    };

    noxservicesystem_service_instance.close(() => {
      close_executed_next_execute_plus_one();
    });
    close_executed_next_execute_plus_one();
  } else if (message_code === message_codes.start_noxservicesystem_service) {
    process.chdir(data.working_directory);
    console.log('NoxServiceSystem service worker working directory:', data.working_directory);

    let noxerve_agent_settings = {
      secured_node: data.settings.secured_node
    };

    const start_noxservicesystem_service = () => {
      noxerve_agent_settings.rsa_2048_key_pair = {
        public: FS.readFileSync(data.settings.rsa_2048_key_pair_path.public, 'utf8'),
        private: FS.readFileSync(data.settings.rsa_2048_key_pair_path.private, 'utf8'),
      };

      // Create nessasary directories.
      if (!FS.existsSync(data.settings.service.services_path)) {
        FS.mkdirSync(data.settings.service.services_path);
      }
      if (!FS.existsSync(data.settings.service.workers_files_path)) {
        FS.mkdirSync(data.settings.service.workers_files_path);
      }
      if (!FS.existsSync(data.settings.service.workers_files_path + '/noxservicesystem')) {
        FS.mkdirSync(data.settings.service.workers_files_path + '/noxservicesystem');
      }

      // change workingdir
      process.chdir(data.settings.service.workers_files_path + '/noxservicesystem');

      const noxerve_agent = new(require(data.noxerve_agent_library_directory + '/nodejs'))(noxerve_agent_settings);
      noxerve_agent.start((error) => {
        if(error) {
          throw error;
        }
        else {
          let start_executed_next_execute = 0;

          let index = 0;
          // Setup interfaces
          const initialize_interfaces = (callback) => {
            const _interface = data.settings.interfaces[index];
            noxerve_agent.createInterface(_interface.interface_name, _interface.interface_settings, (err, id) => {
              if (err) console.log('Create interface error.', err);
              loop_next(callback);
            })
          };

          const loop_next = (callback) => {
            index++;
            if (index < data.settings.interfaces.length) {
              initialize_interfaces(callback);
            } else {
              callback();
            }
          };

          initialize_interfaces(()=> {
            // Setting up relaunch function for NoxServiceSystemService.
            data.relaunchPreloader = () => {
              if (start_executed_next_execute === 2) {
                process.send({
                  message_code: message_codes.request_preloader_relaunch
                });
              } else {
                //
                throw new Error('"relaunchPreloader" is not available until serivce start function executed.');
              }
            };
            data.closePreloader = () => {
              if (start_executed_next_execute === 2) {
                process.send({
                  message_code: message_codes.request_preloader_close
                });
              } else {
                throw new Error('"closePreloader" is not available until serivce start function executed.');
              }
            };
            noxservicesystem_service_instance = new NoxServiceSystemService(noxerve_agent, data);

            const start_executed_next_execute_plus_one = () => {
              start_executed_next_execute++;
              if (start_executed_next_execute === 2) {
                process.send({
                  message_code: message_codes.start_noxservicesystem_service_comfirm
                });
              }
            };

            noxservicesystem_service_instance.start(() => {
              start_executed_next_execute_plus_one();
            });
            start_executed_next_execute_plus_one();
          });
        }
      });
    };

    if (data.settings.secured_node) {
      if (!FS.existsSync(data.settings.rsa_2048_key_pair_path.private)) {
        const readline = require("readline");

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          // Nodejs bugs interface still exists after readline even closed.
          terminal: false
        });

        console.log('Secured node is on. However, RSA 2048 key pair is not generated at "' + data.working_directory + '".');
        rl.question('Help you generate? [y/n]', (answer) => {
          rl.close();
          if (answer === 'y' || answer === 'Y') {
            let succeed = false;
            try {
              execSync('openssl genrsa -out private.pem 2048');
              execSync('openssl rsa -in private.pem -outform PEM -pubout -out public.pem');
              console.log('RSA 2048 key pair generated at "' + data.working_directory + '".');
              succeed = true;
            } catch (error) {
              console.log('openssl error.');
              console.log(error);
              process.send({
                message_code: message_codes.request_launcher_terminate
              });
            }
            if (succeed) start_noxservicesystem_service();
          }
          else {
            process.send({
              message_code: message_codes.request_launcher_terminate
            });
          }
          // rl.removeAllListeners();
        });
      } else {
        start_noxservicesystem_service();
      }
    }
    else {
      start_noxservicesystem_service();
    }
  } else if (message_code === message_codes.terminate_noxservicesystem_service) {
    process.exit();
  }
});

process.on('SIGINT', () => {
  console.log('NoXerve Framework service runtime Caught interrupt signal.');
});

process.on('SIGTERM', () => {});

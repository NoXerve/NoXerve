/**
 * @file NoXerveFramework launch file. [launch.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

process.title = 'NoXerve Framework service';

console.log('');
console.log('');
console.log('88d888b. .d8888b. .d8888b. dP.  .dP dP    dP  TM');
console.log('88\'  `88 88\'  `88 88\'  `88  `8bd8\'  88    88');
console.log('88    88 88.  .88 88.  .88  .d88b.  88.  .88');
console.log('dP    dP `88888P\' `88888P\' dP\'  `dP `8888P88');
console.log('                                         .88');
console.log('                                     d8888P');
console.log('');
console.log('NoXerveFramework ©2019-2020 nooxy org.');
console.log('');

console.log('NoXerve Framework service process id: ' + process.pid);
const message_codes = {
  start_noxframework_service: 0x01,
  start_noxframework_service_comfirm: 0x02,
  close_noxframework_service: 0x03,
  close_noxframework_service_comfirm: 0x04,
  terminate_noxframework_service: 0x05,
  request_preloader_close: 0xff,
  request_preloader_terminate: 0xfe,
  request_preloader_relaunch: 0xfd
}

const NoXerveFrameworkService = require('../noxframework_service');
const FS = require('fs');
const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let noxframework_service_instance;

process.on('message', (message)=> {
  const message_code = message.message_code;
  const data = message.data;

  if(message_code === message_codes.close_noxframework_service) {
    let close_executed_next_execute = 0;
    const close_executed_next_execute_plus_one = ()=> {
      close_executed_next_execute++;
      if(close_executed_next_execute === 2) {
        process.send({
          message_code: message_codes.close_noxframework_service_comfirm
        });
      }
    };

    noxframework_service_instance.close(() => {
      close_executed_next_execute_plus_one();
    });
    close_executed_next_execute_plus_one();
  }
  else if(message_code === message_codes.start_noxframework_service) {
    process.chdir(data.working_directory);
    console.log('NoXerve Framework service working directory:', data.working_directory);

    let noxerve_agent_settings = {
      secured_node: data.settings.start_noxframework_service_comfirm
    };

    const start_noxframework_service = () => {
      const noxerve_agent = new (require(data.noxerve_agent_library_directory+'/nodejs'))(noxerve_agent_settings);
      let start_executed_next_execute = 0;

      // Setting up relaunch function for NoXerveFrameworkService.
      data.relaunchPreloader = ()=> {
        if(start_executed_next_execute === 2) {
          process.send({
            message_code: message_codes.request_preloader_relaunch
          });
        }
        else {
          //
          throw new Error('"relaunchPreloader" is not available until serivce start function executed.');
        }
      };
      data.closePreloader = ()=> {
        if(start_executed_next_execute === 2) {
          process.send({
            message_code: message_codes.request_preloader_close
          });
        }
        else {
          throw new Error('"relaunchPreloader" is not available until serivce start function executed.');
        }
      };
      noxframework_service_instance = new NoXerveFrameworkService(noxerve_agent, data);

      const start_executed_next_execute_plus_one = ()=> {
        start_executed_next_execute++;
        if(start_executed_next_execute === 2) {
          process.send({
            message_code: message_codes.start_noxframework_service_comfirm
          });
        }
      };

      noxframework_service_instance.start(() => {
        start_executed_next_execute_plus_one();
      });
      start_executed_next_execute_plus_one();
    };

    if(data.settings.secured_node) {
      if(!FS.existsSync(data.settings.rsa_2048_key_pair_path.private)) {
        console.log('Secured node is on. However, RSA 2048 key pair is not generated at "'+ data.working_directory + '".');
        rl.question('Help you generate? [y/n]', (answer)=> {
          if(answer === 'y' || answer === 'Y' ) {
            let succeed = false;
            try {
              execSync('openssl genrsa -out private.pem 2048');
              execSync('openssl rsa -in private.pem -outform PEM -pubout -out public.pem');
              console.log('RSA 2048 key pair generated at "'+ data.working_directory + '".');
              succeed = true;
            }
            catch(error) {
              console.log('openssl error.');
              console.log(error);
              process.send({
                message_code: message_codes.request_launcher_terminate
              });
            }
            if(succeed) start_noxframework_service();
          }
        });
      }
      else {
        noxerve_agent_settings.rsa_2048_key_pair = {
          public: FS.readFileSync(data.settings.rsa_2048_key_pair_path.public, 'utf8'),
          private: FS.readFileSync(data.settings.rsa_2048_key_pair_path.private, 'utf8'),
        };
        start_noxframework_service();
      }
    }
  }
  else if(message_code === message_codes.terminate_noxframework_service) {
    process.exit();
  }
});

process.on('SIGINT', () => {
  console.log('NoService runtime Caught interrupt signal.');
});

process.on('SIGTERM', () => {
});

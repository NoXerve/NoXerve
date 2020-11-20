/**
 * @file NoxServiceSystem activity cli file. [noxservicesystem_activity_cli.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

process.title = 'NoxServiceSystem Cli';

// test
const Crypto = require('crypto');
 const fs = require('fs');

const readline = require("readline");

const cli_message_codes = {
  start: 0x01
}

process.on('message', (message) => {
  const message_code = message.message_code;
  const data = message.data;

  if(message_code === cli_message_codes.start) {
    try {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log('CLI(PID: '+process.pid+') connecting to NoxServiceSystem service...');
      let noxerve_agent_settings = {
        secured_node: data.settings.secured_node
      };
      const noxerve_agent = new(require(data.noxerve_agent_library_directory + '/nodejs'))(noxerve_agent_settings);
      noxerve_agent.start((error)=> {
        if(error) throw error;
        console.log('CLI(PID: '+process.pid+') started NoXerveAgent.');
        noxerve_agent.Activity.createActivity(data.settings.connectors_settings, 'cli', null, (error, noxservicesystem_service) => {
          if(error) console.log(error);
          else {
            // test
            noxservicesystem_service.call('getServiceManager', null, (err, result) => {


              // let remain = 5;
              // const service_package_tar_gz_readable_stream_callable_structure = noxerve_agent.NSDT.createCallableStructure({
              //   read_bytes: (bytes_size, push) => {
              //     if(remain) {
              //       remain--;
              //
              //       const buf = Crypto.randomBytes(bytes_size);
              //       console.log(bytes_size);
              //       push(buf);
              //     }
              //     else {
              //       push(null);
              //     }
              //   }
              // });
              let readStream = fs.createReadStream(require("path").join(__dirname, "./stream_test.txt"));
              readStream.on('open', () => {
                const service_package_tar_gz_readable_stream_callable_structure = noxerve_agent.NSDT.createCallableStructure({
                  read_bytes: (bytes_size, push) => {
                    const read_bytes = readStream.read(bytes_size);
                    // console.log(bytes_size, read_bytes);
                    push(read_bytes);
                  }
                });
                result.call('installService', {}, service_package_tar_gz_readable_stream_callable_structure, (error) => {
                  console.log('finished.');
                });
              });

            });

            const cli_cycle = () => {
              rl.question('(NoxServiceSystem CLI) >>> ', (answer)=> {
                // console.log('CLI has not completed yet.', answer);
                if(answer === 'help') {
                  console.log(
                    ' help           --- This menu.\n'+
                    ' joinworker      --- Add worker for NSSystem service by "JoinNewWorkerCode".\n'+
                    ' leaveme        --- Leave this NSSystem worker.\n'+
                    ' stop           --- Stop this NSSystem worker.\n'+
                    ' restart        --- Restart this NSSystem worker.\n'
                  );
                  cli_cycle();
                } else if(answer === 'joinworker') {
                  noxservicesystem_service.call('getJoinNewWorkerCode', null, (err, result) => {
                    console.log('Paste below "JoinNewWorkerCode" during the new worker joining setup.');
                    console.log(result.add_new_worker_code);
                    cli_cycle();
                  });
                }
                else {
                  cli_cycle();
                }
              });
            };
            console.log('CLI(PID: '+process.pid+') connected to NoxServiceSystem service.');
            cli_cycle();
          }
        });
      });

    }
    catch(error) {
      console.log(error);
    }
  }
});

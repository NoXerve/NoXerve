/**
 * @file NoxServiceSystem activity cli file. [noxservicesystem_activity_cli.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

process.title = 'NoxServiceSystem Cli';

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
            const cli_cycle = () => {
              rl.question('(NoxServiceSystem CLI) >>> ', (answer)=> {
                // console.log('CLI has not completed yet.', answer);
                if(answer === 'help') {
                  console.log(
                    ' help           --- This menu.\n'+
                    ' addworker      --- Add worker for NSSystem service by "AddNewWorkerCode".\n'
                  );
                  cli_cycle();
                } else if(answer === 'addworker') {
                  noxservicesystem_service.call('getAddNewWorkerCode', null, (err, result) => {
                    console.log('Paste below "AddNewWorkerCode" during the new worker joining setup.');
                    console.log(result.add_new_worker_code);
                    cli_cycle();
                  });
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

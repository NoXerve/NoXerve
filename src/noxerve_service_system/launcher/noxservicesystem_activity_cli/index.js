/**
 * @file NoxServiceSystem activity cli file. [noxservicesystem_activity_cli.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

process.title = 'NoxServiceSystem Cli';

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const cli_message_codes = {
  start: 0x01
}

process.on('message', (message) => {
  const message_code = message.message_code;
  const data = message.data;

  if(message_code === cli_message_codes.start) {
    try {
      console.log('CLI(PID: '+process.pid+') connecting to NoxServiceSystem service...');
      let noxerve_agent_settings = {
        secured_node: data.settings.secured_node
      };
      const noxerve_agent = new(require(data.noxerve_agent_library_directory + '/nodejs'))(noxerve_agent_settings);
      noxerve_agent.start((error)=> {
        if(error) throw error;
        noxerve_agent.Activity.createActivity(data.settings.interfaces_connect_settings, 'default', null, (error, noxservicesystem_service) => {
          if(error) console.log(error);
          else {
            rl.question('(NoxServiceSystem CLI) >>> ', (answer)=> {

            });
          }
        });
      });

    }
    catch(error) {
      console.log(error);
    }
  }
});

/**
 * @file NoxServiceSystem Service initializer(of worker) file. [initializer.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Check if NoxServiceSystemService initailized.
 */

'use strict';

const Crypto = require('crypto');
const FS = require('fs');
const Constants = require('./constants.json');

module.exports.isMyWorkerFilesInitailized = function() {
  return FS.existsSync(Constants.noxservicesystem_my_worker_initailized_locker_path);
}

module.exports.initailizeMyWorkerFiles = function(noxerve_agent, preloader_parameters, callback) {
  const worker_peers_settings_initialize = (next) => {
    if (!FS.existsSync(Constants.noxservicesystem_worker_peers_settings_path)) {
      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        // terminal: false
      });

      console.log('Has not set up worker peer settings.');
      rl.question('Do you want to:\n 1. Setup as the first worker.\n 2. Join other worker peers? \nInput a number: \n', (answer) => {
        rl.close();
        if (answer === '1') {
          FS.writeFileSync(Constants.noxservicesystem_static_global_random_seed_4096bytes_path, Crypto.randomBytes(4096));
          console.log('Created static global random seed file at "' + Constants.noxservicesystem_static_global_random_seed_4096bytes_path + '".');

          FS.writeFileSync(Constants.noxservicesystem_my_worker_settings_path, JSON.stringify({
            worker_id: 1,
            interfaces: preloader_parameters.settings.interfaces,
            connectors_settings: preloader_parameters.settings.connectors_settings,
          }, null, 2));
          console.log('Created my worker settings file at "' + Constants.noxservicesystem_my_worker_settings_path + '".');

          FS.writeFileSync(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify({
            1: {
              connectors_settings: preloader_parameters.settings.connectors_settings,
              detail: {
                name: 'The first NoxServiceSystem service worker.'
              }
            }
          }, null, 2));
          console.log('Created worker peers settings file at "' + Constants.noxservicesystem_worker_peers_settings_path + '".');
          next(false);
        } else if (answer === '2') {

        }
      });
    } else {
      next(false);
    }
  };

  worker_peers_settings_initialize((error) => {
    if (error) callback(error);
    else {
      FS.writeFileSync(Constants.noxservicesystem_my_worker_initailized_locker_path, '');
      callback(false);
    }
  });
}

module.exports.initailizeNoXerveAgentWorker = function(noxerve_agent, preloader_parameters, callback) {
  noxerve_agent.Worker.on('worker-peer-authentication', (worker_id, worker_authenticity_information, is_valid) => {
    // if(worker_id === 0) {
    //   // [Flag]
    //   is_valid(false);
    // }
    // else {
    //
    // }

    if (worker_authenticity_information.worker_authentication_token === preloader_parameters.settings.worker_authentication_token) {
      is_valid(true);
    } else {
      is_valid(false);
    }
  });
  noxerve_agent.Worker.on('worker-peer-join', (new_worker_peer_id, new_worker_peer_connectors_settings, new_worker_peer_detail, next) => {
    console.log('Worker peer joined.', new_worker_peer_id, new_worker_peer_connectors_settings, new_worker_peer_detail);
    FS.readFile(Constants.noxservicesystem_worker_peers_settings_path, (error, worker_peers_settings_string) => {
      if (error) next(error, () => {});
      else {
        let worker_peers_settings = JSON.parse(worker_peers_settings_string);
        worker_peers_settings[new_worker_peer_id] = {
          connectors_settings: new_worker_peer_connectors_settings,
          detail: new_worker_peer_detail
        };
        FS.writeFile(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2), () => {
          if (error) next(error, () => {});
          else {
            const on_cancel = (next_of_cancel) => {
              console.log('Worker peer with worker id ' + new_worker_peer_id + ' joining canceled.');
              next_of_cancel(false);
            };
            next(false, on_cancel);
          }
        });
      }
    });
  });

  noxerve_agent.Worker.on('worker-peer-update', (remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail, next) => {
    console.log('Worker peer updated.', remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail);
    FS.readFile(Constants.noxservicesystem_worker_peers_settings_path, (error, worker_peers_settings_string) => {
      if (error) next(error, () => {});
      else {
        let worker_peers_settings = JSON.parse(worker_peers_settings_string);
        worker_peers_settings[remote_worker_peer_id] = {
          connectors_settings: remote_worker_peer_connectors_settings,
          detail: remote_worker_peer_detail
        };
        FS.writeFile(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2), () => {
          if (error) next(error, () => {});
          else {
            const on_cancel = (next_of_cancel) => {
              console.log('Worker peer with worker id ' + remote_worker_peer_id + ' updating canceled.');
              next_of_cancel(false);
            };
            next(false, on_cancel);
          }
        });
      }
    });
  });

  noxerve_agent.Worker.on('worker-peer-leave', (remote_worker_peer_id, next) => {
    console.log('Worker peer leaved.', remote_worker_peer_id);
    FS.readFile(Constants.noxservicesystem_worker_peers_settings_path, (error, worker_peers_settings_string) => {
      if (error) next(error, () => {});
      else {
        let worker_peers_settings = JSON.parse(worker_peers_settings_string);
        delete worker_peers_settings[remote_worker_peer_id];
        FS.writeFile(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2), () => {
          if (error) next(error, () => {});
          else {
            const on_cancel = (next_of_cancel) => {
              console.log('Worker peer with worker id ' + remote_worker_peer_id + ' leaving canceled.');
              next_of_cancel(false);
            };
            next(false, on_cancel);
          }
        });
      }
    });
  });

  // Check any settings updated.
  const worker_peers_settings = JSON.parse(FS.readFileSync(Constants.noxservicesystem_worker_peers_settings_path));
  const static_global_random_seed_4096bytes = FS.readFileSync(Constants.noxservicesystem_static_global_random_seed_4096bytes_path);
  const preloader_parameters_settings_interfaces = preloader_parameters.settings.interfaces;
  const preloader_parameters_settings_connectors_settings = preloader_parameters.settings.connectors_settings;
  const my_worker_settings = JSON.parse(FS.readFileSync(Constants.noxservicesystem_my_worker_settings_path));
  const my_worker_files_interfaces = my_worker_settings.interfaces;
  const my_worker_files_connectors_settings = my_worker_settings.connectors_settings;
  const is_interfaces_changed = !(JSON.stringify(preloader_parameters_settings_interfaces) === JSON.stringify(my_worker_files_interfaces));
  const is_connectors_settings_changed = !(JSON.stringify(preloader_parameters_settings_connectors_settings) === JSON.stringify(my_worker_files_connectors_settings));

  noxerve_agent.Worker.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error) => {
    if (error) callback(error);
    else {
      noxerve_agent.Worker.importMyWorkerAuthenticityData(parseInt(my_worker_settings.worker_id), {
        worker_authentication_token: preloader_parameters.settings.worker_authentication_token
      }, (error) => {
        if (error) callback(error);
        else {
          noxerve_agent.Worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
            if (error) callback(error);
            else {
              if (is_interfaces_changed && !is_connectors_settings_changed) {
                callback(new Error('Interfaces settings changed. But interface connect settings are not changed.'));
              } else if (is_connectors_settings_changed) {
                noxerve_agent.Worker.updateMe(preloader_parameters_settings_connectors_settings, null, (error) => {
                  if (error) callback(error);
                  else {
                    FS.writeFileSync(Constants.noxservicesystem_my_worker_settings_path, JSON.stringify({
                      worker_id: my_worker_settings.worker_id,
                      interfaces: preloader_parameters.settings.interfaces,
                      connectors_settings: preloader_parameters.settings.connectors_settings,
                    }, null, 2));
                  }
                });
              } else {
                // Finished
                callback(error);
              }
            }
          });
        }
      });
    }
  });
}

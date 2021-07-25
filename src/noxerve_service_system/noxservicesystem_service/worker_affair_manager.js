/**
 * @file NoxServiceSystem Service worker affiar manager file. [worker_affair_manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 * @description Check if NoxServiceSystemService initailized.
 */

'use strict';

const Crypto = require('crypto');
const FS = require('fs');
const Constants = require('./constants.json');
const Manifest = require('./manifest.json');
const PROBABILITY_OF_BEING_CABINET_MEMBER = 20;
const MAX_CABINET_MEMBER_COUNT = 20;

function WorkerAffairManager(settings) {
  this._settings = settings;
  this._noxerve_agent_worker = settings.noxerve_agent_worker;
};

WorkerAffairManager.prototype.isMyWorkerFilesInitailized = function() {
  return FS.existsSync(Constants.noxservicesystem_my_worker_initailized_locker_path);
};

WorkerAffairManager.prototype.getJoinNewWorkerCode = function(callback) {
  const my_worker_settings = JSON.parse(FS.readFileSync(Constants.noxservicesystem_my_worker_settings_path));
  const worker_authentication_token_base64 = my_worker_settings.worker_authentication_token_base64;
  const connectors_settings_json_base64 = Buffer.from(JSON.stringify(my_worker_settings.connectors_settings)).toString('base64');
  callback(false, my_worker_settings.worker_id + '.' + connectors_settings_json_base64 + '.' + worker_authentication_token_base64);
};

const decodeJoinNewWorkerCode = function(add_new_worker_code) {
  let result = [null, null, null];
  const splited = add_new_worker_code.split('.');
  result[0] = parseInt(splited[0]);
  result[1] = JSON.parse(Buffer.from(splited[1], 'base64').toString('utf8'));
  result[2] = splited[2];
  return result;
};

WorkerAffairManager.prototype._calculateIsCabinetMemberByWorkerId = function(worker_id_int, callback) {
  this._settings.noxerve_agent_worker.GlobalDeterministicRandomManager.generateIntegerInRange(Buffer.from([worker_id_int]), 0, 100, (error, result) => {
    callback(false, (result <= PROBABILITY_OF_BEING_CABINET_MEMBER)?true:false);
  });
  // callback(true, true);
};

WorkerAffairManager.prototype.decodeJoinNewWorkerCode = decodeJoinNewWorkerCode;

WorkerAffairManager.prototype.initailizeMyWorkerFiles = function(noxerve_agent, preloader_parameters, callback) {
  const worker_peers_settings_initialize = (next) => {
    if (!FS.existsSync(Constants.noxservicesystem_worker_peers_settings_path)) {
      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        // terminal: false
      });

      console.log('Has not set up worker peer settings.');
      rl.question('Do you want to:\n 1. Setup as the first worker.\n 2. Join other worker peers?(As a worker without suffrage) \n 3. Join other worker peers?(As a worker with suffrage) \nInput a number: \n', (answer) => {
        if (answer === '1') {
          rl.close();
          rl.removeAllListeners();
          FS.writeFileSync(Constants.noxservicesystem_static_global_random_seed_4096bytes_path, Crypto.randomBytes(4096));
          console.log('Created static global random seed file at "' + Constants.noxservicesystem_static_global_random_seed_4096bytes_path + '".');

          FS.writeFileSync(Constants.noxservicesystem_my_worker_settings_path, JSON.stringify({
            worker_id: 1,
            worker_authentication_token_base64: Crypto.randomBytes(64).toString('base64'),
            interfaces: preloader_parameters.settings.interfaces,
            connectors_settings: preloader_parameters.settings.connectors_settings,
          }, null, 2));
          console.log('Created my worker settings file at "' + Constants.noxservicesystem_my_worker_settings_path + '".');

          FS.writeFileSync(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify({
            1: {
              connectors_settings: preloader_parameters.settings.connectors_settings,
              detail: {
                name: 'The first NoxServiceSystem service worker.',
                suffrage: true,
                member_of_cabinet: true
              }
            }
          }, null, 2));
          console.log('Created worker peers settings file at "' + Constants.noxservicesystem_worker_peers_settings_path + '".');
          next(false);
        } else if (answer === '2' || answer === '3') {
          rl.question('Please enter "JoinNewWorkerCode" obtain from other already joined worker: \n', (add_new_worker_code) => {
            const decode_result = decodeJoinNewWorkerCode(add_new_worker_code);
            const remote_worker_id = decode_result[0];
            const remote_worker_interfaces_for_joining_me = decode_result[1];
            const worker_authentication_token_base64 = decode_result[2];
            this._noxerve_agent_worker.joinMe(remote_worker_interfaces_for_joining_me, preloader_parameters.settings.connectors_settings, {
                name: 'A NoxServiceSystem service worker joined by worker with worker_id "' + remote_worker_id + '".',
                suffrage: answer === '2'?false:true
              }, {
                worker_authentication_token: worker_authentication_token_base64
              },
              (error, my_worker_id, worker_peers_settings, static_global_random_seed_4096bytes) => {
                if (error) {
                  console.log('\n***** Please comfirm that all ' + Manifest.service_display_name + ' workers are online. *****\n');
                  next(error)
                } else {
                  rl.close();
                  rl.removeAllListeners();
                  this._noxerve_agent_worker.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error) => {
                    if (error) {callback(error); return;};
                    let is_cabinet_member = false;

                    const proceed = () => {
                      worker_peers_settings[my_worker_id].detail.member_of_cabinet = is_cabinet_member;

                      FS.writeFileSync(Constants.noxservicesystem_static_global_random_seed_4096bytes_path, static_global_random_seed_4096bytes);
                      console.log('Created static global random seed file at "' + Constants.noxservicesystem_static_global_random_seed_4096bytes_path + '".');

                      FS.writeFileSync(Constants.noxservicesystem_my_worker_settings_path, JSON.stringify({
                        worker_id: my_worker_id,
                        worker_authentication_token_base64: worker_authentication_token_base64,
                        interfaces: preloader_parameters.settings.interfaces,
                        connectors_settings: preloader_parameters.settings.connectors_settings,
                      }, null, 2));
                      console.log('Created my worker settings file at "' + Constants.noxservicesystem_my_worker_settings_path + '".');

                      FS.writeFileSync(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2));
                      console.log('Created worker peers settings file at "' + Constants.noxservicesystem_worker_peers_settings_path + '".');
                      next(false);
                    };

                    if(answer === '2'?false:true) {
                      this._calculateIsCabinetMemberByWorkerId(my_worker_id, (error, result) => {
                        is_cabinet_member = result;
                        proceed();
                      });
                    }
                    else{
                      proceed();
                    }
                  });
                }
              });
          });
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
};

WorkerAffairManager.prototype.initailizeNoXerveAgentWorker = function(noxerve_agent, preloader_parameters, callback) {

  const worker_peers_settings = JSON.parse(FS.readFileSync(Constants.noxservicesystem_worker_peers_settings_path));
  const static_global_random_seed_4096bytes = FS.readFileSync(Constants.noxservicesystem_static_global_random_seed_4096bytes_path);
  const preloader_parameters_settings_interfaces = preloader_parameters.settings.interfaces;
  const preloader_parameters_settings_connectors_settings = preloader_parameters.settings.connectors_settings;
  const my_worker_settings = JSON.parse(FS.readFileSync(Constants.noxservicesystem_my_worker_settings_path));
  const my_worker_files_interfaces = my_worker_settings.interfaces;
  const worker_authentication_token_base64 = my_worker_settings.worker_authentication_token_base64;
  const my_worker_files_connectors_settings = my_worker_settings.connectors_settings;
  const is_interfaces_changed = !(JSON.stringify(preloader_parameters_settings_interfaces) === JSON.stringify(my_worker_files_interfaces));
  const is_connectors_settings_changed = !(JSON.stringify(preloader_parameters_settings_connectors_settings) === JSON.stringify(my_worker_files_connectors_settings));

  this._noxerve_agent_worker.on('worker-peer-authenticate', (worker_id, worker_authenticity_information, is_valid) => {
    // if(worker_id === 0) {
    // //   // [Flag]
    // //   is_valid(false);
    // }
    if (worker_authenticity_information.worker_authentication_token === worker_authentication_token_base64) {
      is_valid(true);
    } else {
      is_valid(false);
    }
  });
  this._noxerve_agent_worker.on('worker-peer-join', (new_worker_peer_id, new_worker_peer_connectors_settings, new_worker_peer_detail, next) => {
    let is_cabinet_member = false;
    const proceed = () => {
      console.log('\nA worker peer request joining. Here are the informations:\n', {
        new_worker_peer_id: new_worker_peer_id,
        new_worker_peer_connectors_settings: new_worker_peer_connectors_settings,
        new_worker_peer_detail: new_worker_peer_detail,
        member_of_cabinet: is_cabinet_member
      });

      FS.readFile(Constants.noxservicesystem_worker_peers_settings_path, (error, worker_peers_settings_string) => {
        if (error) next(error, () => {}, () => {});
        else {
          const on_confirm = (next_of_confirm) => {
            console.log('Worker peer with worker id ' + new_worker_peer_id + ' joining confrimed.');
            let worker_peers_settings = JSON.parse(worker_peers_settings_string);
            new_worker_peer_detail.member_of_cabinet = is_cabinet_member;
            worker_peers_settings[new_worker_peer_id] = {
              connectors_settings: new_worker_peer_connectors_settings,
              detail: new_worker_peer_detail,
            };
            FS.writeFile(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2), next_of_confirm);
          };
          const on_cancel = (next_of_cancel) => {
            console.log('Worker peer with worker id ' + new_worker_peer_id + ' joining canceled.');
            next_of_cancel(false);
          };
          next(false, on_confirm, on_cancel);
        }
      });
    };

    if(new_worker_peer_detail.suffrage) {
      this._calculateIsCabinetMemberByWorkerId(new_worker_peer_id, (error, result) => {
        is_cabinet_member = result;
        proceed();
      });
    }
    else{
      proceed();
    }
  });

  this._noxerve_agent_worker.on('worker-peer-update', (remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail, next) => {
    console.log('\nA worker peer request updating. Here are the informations:\n', {
      remote_worker_peer_id: remote_worker_peer_id,
      remote_worker_peer_connectors_settings: remote_worker_peer_connectors_settings,
      remote_worker_peer_detail: remote_worker_peer_detail
    });
    FS.readFile(Constants.noxservicesystem_worker_peers_settings_path, (error, worker_peers_settings_string) => {
      if (error) next(error, () => {}, () => {});
      else {
        const on_confirm = (next_of_confirm) => {
          let worker_peers_settings = JSON.parse(worker_peers_settings_string);
          worker_peers_settings[remote_worker_peer_id] = {
            connectors_settings: remote_worker_peer_connectors_settings,
            detail: remote_worker_peer_detail
          };
          FS.writeFile(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2), next_of_confirm);
        };
        const on_cancel = (next_of_cancel) => {
          console.log('Worker peer with worker id ' + remote_worker_peer_id + ' updating canceled.');
          next_of_cancel(false);
        };
        next(false, on_confirm, on_cancel);
      }
    });
  });

  this._noxerve_agent_worker.on('worker-peer-leave', (remote_worker_peer_id, next) => {
    console.log('\nA worker peer request leaving. Here are the informations:\n', remote_worker_peer_id);
    FS.readFile(Constants.noxservicesystem_worker_peers_settings_path, (error, worker_peers_settings_string) => {
      if (error) next(error, () => {}, () => {});
      else {
        const on_confirm = (next_of_confirm) => {
          let worker_peers_settings = JSON.parse(worker_peers_settings_string);
          delete worker_peers_settings[remote_worker_peer_id];
          FS.writeFile(Constants.noxservicesystem_worker_peers_settings_path, JSON.stringify(worker_peers_settings, null, 2), next_of_confirm);
        };
        const on_cancel = (next_of_cancel) => {
          console.log('Worker peer with worker id ' + remote_worker_peer_id + ' leaving canceled.');
          next_of_cancel(false);
        };
        next(false, on_confirm, on_cancel);
      }
    });
  });

  this._noxerve_agent_worker.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error) => {
    if (error) callback(error);
    else {
      this._noxerve_agent_worker.importMyWorkerAuthenticityData(parseInt(my_worker_settings.worker_id), {
        worker_authentication_token: worker_authentication_token_base64
      }, (error) => {
        if (error) callback(error);
        else {
          this._noxerve_agent_worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
            if (error) callback(error);
            else {
              if (is_interfaces_changed && !is_connectors_settings_changed) {
                callback(new Error('Interfaces settings changed. But interface connect settings are not changed.'));
              } else if (is_connectors_settings_changed) {
                this._noxerve_agent_worker.updateMe(preloader_parameters_settings_connectors_settings, null, (error) => {
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
};

WorkerAffairManager.prototype.onWorkerPeerJoin = function(listener) {

};

WorkerAffairManager.prototype.onWorkerPeerUpdate = function(listener) {

};

WorkerAffairManager.prototype.onWorkerPeerLeave = function(listener) {

};

module.exports = WorkerAffairManager;

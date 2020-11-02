/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

'use strict';

const fs = require('fs');
const static_global_random_seed_4096bytes = fs.readFileSync('./worker/static_global_random_seed_4096bytes');
const log = (...params) => {
  console.log.apply(null, params);
};

log('[Tester] Start testing...');

let Tests = [
  'node_connector_send_test',
  'node_interface_send_test',
  'activity_test',
  'service_function_test',
  'service_yield_test',
  'worker_test',
  'worker_func1_call_test',
  'worker_func2_call_test',
  'worker_field2_yield_test',
  'worker_field1_yield_test',
  'nsdt_test',
  // 'worker_scope_check_integrity',
  // 'worker_scope_get_peer_list',
  // 'worker_scope_broad_request_reponse',
  // 'worker_scope_add_worker',
  // 'worker_group_creation',
  'worker_group_channel_braodcast',
  'worker_group_channel_request',
  'worker_group_channel_braodcast_request',
  'worker_group_channel_synchronize',
  'worker_group_channel_braodcast_synchronize',
  'other_test'
];

process.on('SIGINT', ()=> {
  log('Tests left:', Tests);
  process.exit();
});

let test_count = Tests.length;

let finish = (test_name) => {
  let index = Tests.indexOf(test_name);
  if (index !== -1) Tests.splice(index, 1);
  log('[Tester] Progress: '+(test_count-Tests.length)+'/'+test_count+'. Finished "'+test_name+'" test.');
  if (!Tests.length) {
    log('[Tester] Test finished. Executed all tests. Validate your test from printed result.');
    process.exit();
  }
};

const NSDT = new(require('../nsdt'))({});
let NoXerveAgent = new(require('../index'))({});
let Node2 = new(require('../node/secured_node'))({
  rsa_2048_key_pair: {
    public: fs.readFileSync('./public.pem', 'utf8'),
    private: fs.readFileSync('./private.pem', 'utf8'),
  }
});
let Node = new(require('../node'))();
let Activity = new(require('../service/activity'))();
let Service = new(require('../service/service'))();
let Worker = new(require('../worker'))();

let Protocol = new(require('../protocol'))({
  modules: {
    activity: Activity,
    service: Service,
    worker: Worker,
    nsdt: NSDT
  },
  node_module: Node2
});
let Utils = require('../utils');

log('[Utils module] random8Bytes ', Utils.random8Bytes());
// log('[NSDT module] ', NSDT.decode(NSDT.encode({
//   host: '0.0.0.0',
//   port: 12345
// })));
finish('other_test');

log('[Node module] NoXerveAgent Object: ', NoXerveAgent);
log('[Node module] Node Object: ', Node);
log('[Node module] Protocol Object: ', Protocol);


// **** Node Module Test Start ****

log('[Node module] Preparing test...');

// Test created tunnel either from "createTunnel" function or "create-tunnel" event.
let tunnel_test = (tunnel) => {
  if (tunnel.returnValue('from_connector')) log('[Node module] Tunnel created from connector.');
  if (tunnel.returnValue('from_interface')) log('[Node module] Tunnel created from interface.');
  tunnel.on('ready', () => {
    if (tunnel.returnValue('from_connector')) {
      log('[Node module] Tunnel created from connector. Ready.');
      tunnel.send(Buffer.from('Sent from connector.'), (error) => {
        log('[Node module] "Sent from interface." sent.');
      });
    }
    if (tunnel.returnValue('from_interface')) {
      log('[Node module] Tunnel created from interface. Ready.');
      tunnel.send(Buffer.from('Sent from interface.'), (error) => {
        log('[Node module] "Sent from interface." sent.');
      });
    }
  });
  tunnel.on('data', (data) => {
    if (tunnel.returnValue('from_connector')) {
      log('[Node module] Tunnel created from connector received data: "', data.toString('utf8'), '"');
      finish('node_interface_send_test');
    }
    if (tunnel.returnValue('from_interface')) {
      log('[Node module] Tunnel created from interface received data: "', data.toString('utf8'), '"');
      finish('node_connector_send_test');
    }
  });
  tunnel.on('close', () => {
    if (tunnel.returnValue('from_connector')) {
      log('[Node module] Tunnel created from connector closed.');
    }
    if (tunnel.returnValue('from_interface')) {
      log('[Node module] Tunnel created from interface closed.');
    }
  });
  tunnel.on('error', (error) => {
    log('[Node module] Tunnel error.', error);
  });

};
Node.on('tunnel-create', tunnel_test)
log('[Node module] Create interface.');

Node.start(() => {
  Node.createInterface('WebSocket', {
    host: '0.0.0.0',
    port: 1234
  }, (err, id) => {
    if (err) log('[Node module] Create interface error.', err);
    log('[Node module] Create tunnel.');
    Node.createTunnel('WebSocket', {
      host: '0.0.0.0',
      port: 1234
    }, (err, tunnel) => {
      if (err) log('[Node module] Create tunnel error.', err)
      else {
        tunnel_test(tunnel);
      }
    });
  })
});


// **** Node Module Test End ****

// **** Protocol Module Test Start ****
Protocol.start();
// **** Protocol Module Test End ****

Node2.start(() => {
  Node2.createInterface('WebSocket', {
    host: '0.0.0.0',
    port: 12345
  }, (err, id) => {
    if (err) log('[Node2 module] Create interface error.', err);

    // **** Worker Module Test Start ****

    let worker_peers_settings = {
      1: {
        connectors_settings: [{
          interface_name: 'WebSocket',
          connector_settings: {
            host: '0.0.0.0',
            port: 12345
          }
        }],
        detail: {}
      }
    };
    Worker.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error) => {
      if (error) log('[Worker module] importStaticGlobalRandomSeed error.', error);
      Worker.importMyWorkerAuthenticityData(1, 'whatsoever_auth', (error)=> {
        if (error) log('[Worker module] importMyWorkerAuthenticityData error.', error);
        Worker.importWorkerPeersSettings(worker_peers_settings, (error)=> {
          if (error) log('[Worker module] importWorkerPeersSettings error.', error);
          Worker.on('worker-peer-authentication', (worker_id, worker_authenticity_information, is_valid)=> {
            if(worker_id === 0) {
              // Initailize new worker.
            }
            log('[Worker module] "worker-peer-authentication" event. ', worker_id, worker_authenticity_information);
            is_valid(true);
          });
          Worker.start((error) => {
            if (error) log('[Worker module] start error.', error);
            Worker.onWorkerSocketCreate('purpose 1', (parameters, remote_worker_id, worker_socket)=> {
              log('[Worker module] onWorkerSocketCreate OK.', parameters, remote_worker_id, worker_socket);
              worker_socket.on('close', () => {
                log('[Worker module] WorkerSocket from onWorkerSocketCreate closed.');
                finish('worker_test');
              });
              worker_socket.define('func2', (service_function_parameter, return_data, yield_data) => {
                log('[Worker module] WorkerSocket function on createWorkerSocket called.');
                yield_data(321);
                yield_data({foo: 321});
                yield_data(Buffer.from([5, 4, 3, 0, 1]));
                return_data('hehe');
              });
              worker_socket.call('func1', {foo: 'call from onWorkerSocketCreate'}, (err, data, eof, acknowledge)=> {
                log('[Worker module] "func1" Return value: ', data);
                if(eof) finish('worker_func1_call_test');
                if(acknowledge) acknowledge('ack');
              });
              worker_socket.handleYielding('field2', (yielding_handler_parameter, ready_yielding) => {
                log('[Worker module] "field2" handleYielding started.');
                log('[Worker module] Parameters value: ', yielding_handler_parameter);
                ready_yielding('"field2" ok for yielding.', (error, data, eof)=> {
                  if(error) log('[Worker module] "field1" Yielding error.', error);
                  log('[Worker module] "field2" Yielded value: ', data);
                  if(eof) {
                    finish('worker_field2_yield_test');
                  };
                });
              });
              worker_socket.startYielding('field1', 'yield from createWorkerSocket', (error, yielding_start_parameter, finish_yield, yield_data) => {
                if (error) log('[Worker module] "field1" Yield error.', error);
                log('[Worker module] "field1" yielding_start_parameter value: ', yielding_start_parameter);

                yield_data(321);
                yield_data({foo: 321}, (acknowledge_message_bytes)=> {
                  log('[Worker module] "field1" acknowledge_message_bytes.', acknowledge_message_bytes);
                  yield_data(Buffer.from([5, 4, 3, 0, 1]));
                  finish_yield('hehe');
                });
              });
            });

            // WorkerSocket test
            Worker.createWorkerSocket('purpose 1', {p: 1}, 1, (error, worker_socket)=> {
              if (error) {
                log('[Worker module] createWorkerSocket error.', error);
              }
              else {
                worker_socket.on('close', () => {
                  log('[Worker module] WorkerSocket from createWorkerSocket closed.');
                });
                worker_socket.define('func1', (service_function_parameter, return_data, yield_data) => {
                  log('[Worker module] WorkerSocket function on createWorkerSocket called.');
                  yield_data(123);
                  yield_data({foo: 123}, (acknowledge_message_bytes)=> {
                    log('[Worker module] WorkerSocket function on createWorkerSocket. acknowledge_message_bytes', acknowledge_message_bytes);
                    yield_data(Buffer.from([5, 4, 3, 2, 1]));
                    return_data('haha');
                  });
                });
                worker_socket.call('func2', {foo: 'call from createWorkerSocket'}, (err, data, eof)=> {
                  log('[Worker module] "func2" Return value: ', data);
                  if(eof) finish('worker_func2_call_test');
                });
                worker_socket.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
                  log('[Worker module] "field1" handleYielding started.');
                  log('[Worker module] Parameters value: ', yielding_handler_parameter);
                  ready_yielding('"field1" ok for yielding.', (error, data, eof, acknowledge)=> {
                    if(error) log('[Worker module] "field1" Yielding error.', error);
                    if(acknowledge) acknowledge('ack');
                    log('[Worker module] "field1" Yielded value: ', data);
                    if(eof) {
                      finish('worker_field1_yield_test');
                      setTimeout(()=>{worker_socket.close()}, 1500);
                    };
                  });
                });
                worker_socket.startYielding('field2', 'yield from createWorkerSocket', (error, yielding_start_parameter, finish_yield, yield_data) => {
                  if (error) log('[Worker module] "field2" Yield error.', error);
                  log('[Worker module] "field2" yielding_start_parameter value: ', yielding_start_parameter);

                  yield_data(123);
                  yield_data({foo: 123});
                  yield_data(Buffer.from([5, 4, 3, 2, 1]));
                  finish_yield('haha');
                });
                log('[Worker module] createWorkerSocket OK.', worker_socket);
                // finish('worker_test');
              }
            });

            // WorkerScope tests
            Worker.createWorkerScope('test_scope', [1], (error, worker_scope) => {
              if (error) log('[Worker module] "test_scope" error.', error);
              // log('worker list: ', worker_scope._worker_list);
              worker_scope.on('integrity-pass', () => {

              });
              worker_scope.checkIntegrity((error) => {
                if (error) log('[Worker module] "checkIntegrity" error.', error);
                finish('worker_scope_check_integrity');
              });
              let list = worker_scope.returnScopePeerList();
              // log('workers in scope: ', list);
              finish('worker_scope_get_peer_list');
              worker_scope.broadcastRequest(Buffer.from([0x02,6,6,6,6]),
                (worker_id, synchronize_error, synchronize_acknowledgment_message_bytes, callback) => {
                  // maybe need more check for security
                  // log('[worker_scope] worker '+ worker_id +' respond !');
                  // log('sync_ack info: ' + synchronize_acknowledgment_message_bytes.toString('utf8'));
                  if(synchronize_error) {
                    // log('with error: '+ synchronize_error);
                    callback(synchronize_error, false);
                  }
                  else callback(false, true);
                },
                (error, finished_worker_list) => {
                  if(error) {
                    // log('[worker_scope] finish broadcastRequest with error:' + error);
                    // log('only ' + finished_worker_list + ' finished');
                  }
                  else{
                    // log('[worker_scope] finish broadcastRequest');
                    // log('all finished. ( ' + finished_worker_list + ' )');
                  }
                  finish('worker_scope_broad_request_reponse');
                }
              );
              // plese don't add worker itself. It will break the other worker scope tests.
              worker_scope.add_worker(1,
                (worker_id, synchronize_error, request_message_bytes, _callback) => {
                // maybe need more check for security
                log('[worker_scope] add_worker: worker '+ worker_id +' respond.');
                if(synchronize_error) {
                  log('[worker_scope] sync with error: '+ synchronize_error);
                  _callback(synchronize_error, false);
                }
                else _callback(false, true);
                },
                (error, finished_worker_list) => {
                  if(error) {
                    log('[worker_scope] finish adding worker with error:' + error);
                    log('[worker_scope] only ' + finished_worker_list + ' finished');
                  }
                  else{
                    log('[worker_scope] finish adding worker');
                    log('[worker_scope] all finished. ( ' + finished_worker_list + ' )');
                  }
                  finish('worker_scope_add_worker');
                }
              );
            });

            // WorkerGroup tests
            Worker.createWorkerGroup('test_group', [1], (error, worker_group) => {
              if (error) log('[Worker module] "test_group" error.', error);
              else {
                finish('worker_group_creation');
              }
              worker_group.createChannel(Buffer.from([0x00, 0x01, 0x02, 0x01, 0x02, 0x01, 0x02, 0x02]), (error, channel) => {
                if (error) log('[Worker module] "createChannel" error.', error);
                channel.on('data', (group_peer_id, data_bytes) => {
                  log('[Worker module: Channel] data: ', group_peer_id, data_bytes);
                });
                channel.on('request-response', (group_peer_id, data_bytes, response) => {
                  log('[Worker module: Channel] request: ', group_peer_id, data_bytes);
                  response(Buffer.from([group_peer_id + 1]));
                });

                channel.on('handshake', (group_peer_id, synchronize_message_bytes, synchronize_acknowledgment) => {
                  log('[Worker module: Channel] synchronize: ', group_peer_id, synchronize_message_bytes);
                  synchronize_acknowledgment(Buffer.from([1]), (synchronize_acknowledgment_error, acknowledge_message_bytes) => {
                    log('[Worker module: Channel] acknowledge: ', synchronize_acknowledgment_error, acknowledge_message_bytes);
                  });
                });

                // APIs.

                channel.broadcast(Buffer.from([0x00, 0x01, 0x02, 0x04]), (error, finished_group_peer_id_list) => {
                  log('[Worker module: Channel] broadcast results: ', error, finished_group_peer_id_list);
                  finish('worker_group_channel_braodcast');
                });

                channel.request(1, Buffer.from([0x55]), (error, response_data_bytes) => {
                  log('[Worker module: Channel] response: ', error, response_data_bytes);
                  finish('worker_group_channel_request');
                });

                channel.broadcastRequest(Buffer.from([0x53]), (group_peer_id, error, response_data_bytes, comfirm_error_finish_status) => {
                  log('[Worker module: Channel] response(broadcast): ', group_peer_id, error, response_data_bytes);
                  comfirm_error_finish_status(false, true);
                }, (error, finished_group_peer_id_list) => {
                  log('[Worker module: Channel] broadcastRequest onfinish results: ', error, finished_group_peer_id_list);
                  finish('worker_group_channel_braodcast_request');
                });

                channel.synchronize(1, Buffer.from([0x00]), (synchronize_error, synchronize_acknowledgment_message_bytes, acknowledge) => {
                  log('[Worker module: Channel] synchronize_acknowledgment: ', synchronize_error, synchronize_acknowledgment_message_bytes);
                  acknowledge(Buffer.from([0x02]), (error) => {
                    if(error) log('[Worker module: Channel] acknowledge error', error);
                    finish('worker_group_channel_synchronize');
                  });
                });

                channel.broadcastSynchronize(Buffer.from([0x00]), (group_peer_id, synchronize_error, synchronize_acknowledgment_message_bytes, comfirm_synchronize_error_finish_status, acknowledge) => {
                  log('[Worker module: Channel] synchronize_acknowledgment(broadcast): ', group_peer_id, synchronize_error, synchronize_acknowledgment_message_bytes);
                  // comfirm_synchronize_error_finish_status(false, true);
                  if(synchronize_error) {
                    comfirm_synchronize_error_finish_status(synchronize_error, false);
                    acknowledge(false);
                  }
                  else {
                    // acknowledge(false);
                    acknowledge(Buffer.from([group_peer_id]), (error, comfirm_acknowledge_error_finish_status) => {
                      if(error) log('[Worker module: Channel] acknowledge error(broadcast)', error);
                      comfirm_acknowledge_error_finish_status(error, error?false:true);
                    });
                  }
                }, (error, finished_synchronize_group_peer_id_list, finished_acknowledge_group_peer_id_list) => {
                  log('[Worker module: Channel] broadcastSynchronize finished. results: ', error, finished_synchronize_group_peer_id_list, finished_acknowledge_group_peer_id_list);
                  finish('worker_group_channel_braodcast_synchronize');
                });
              });
            });
          });
        });
      });
    });


    // **** Worker Module Test End ****

    // **** Service Module Test Start ****
    Service.onActivityCreate('default', (parameter, service_of_activity) => {
      log('[Service module] Activity(default) created. parameter: ', parameter);
      service_of_activity.on('close', ()=> {
        log('[Service module] Service closed.');
      });
      service_of_activity.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
        log('[Service module] Service handleYielding started.');
        log('[Service module] Parameters value: ', yielding_handler_parameter);
        ready_yielding('service ok for yielding.', (error, data, eof, acknowledge)=> {
          if(acknowledge) acknowledge('ack');
          if(error) log('[Service module] Yielding error.', error);
          log('[Service module] Yielded value: ', data);
          if(eof) finish('service_yield_test');
        });
      });
      service_of_activity.define('test_func', (service_function_parameter, return_data, yield_data) => {
        log('[Service module] Service function called.');
        log('[Service module] Parameters value: ', service_function_parameter);

        const callable_struture = NSDT.createCallableStructure({haha: (callback)=> {
          log('[NSDT module] NSDT haha called.');
          const callable_struture_2 = NSDT.createCallableStructure({nah: ()=> {}});
          callback(callable_struture, callable_struture_2, 321);
        }});

        callable_struture.on('close', ()=> {
          log('[NSDT module] NSDT haha closed.');
        });
        // service_of_activity.close();
        yield_data({bar: 13579});
        yield_data(Utils.random8Bytes());

        // Test acknowledgment.
        yield_data(callable_struture, (acknowledge_message_bytes) => {
          log('[Service module] Service function acknowledge_message_bytes: ', acknowledge_message_bytes);
          yield_data(Buffer.from([1, 2, 3, 4, 5]));
          return_data({bar: 'last round'});
          finish('service_function_test');
        });
      });
    });
    // **** Service Module Test End ****

    log('[Activity module] Activity create test.');

    // **** Activity Module Test Start ****
    Activity.createActivity([{
      interface_name: 'WebSocket',
      connector_settings: {
        host: '0.0.0.0',
        port: 12345
      }
    }], 'default', {a: 'parameter a'}, (error, activity_of_service) => {

      if (error) log('[Activity module] Activity create error.', error);
      else {
        log('[Activity module] Activity created.');
        activity_of_service.on('close', () => {
          log('[Activity module] Activity closed.');
          finish('activity_test');
        });
        activity_of_service.startYielding('field1', 'yield from activity', (error, yielding_start_parameter, finish_yield, yield_data) => {
          if (error) log('[Activity module] Yield error.', error);
          log('[Activity module] yielding_start_parameter value: ', yielding_start_parameter);

          yield_data(123);
          yield_data({foo: 123}, (acknowledge_message_bytes) => {
            log('[Activity module] Yield acknowledge_message_bytes.', acknowledge_message_bytes);
            yield_data(Buffer.from([5, 4, 3, 2, 1]));
            finish_yield('haha');
          });
        });
        activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof, acknowledge)=> {
          if (err) {
            log('[Activity module] call test_func error.', err);
          }
          log('[Activity module] Return value: ', data);
          if(acknowledge) acknowledge('ack');

          // Twice
          if(data.isCallableStructure) {
            data.call('haha', (...params) => {
              log('[NSDT module] haha callback params, ', params);
              finish('nsdt_test');
            });
          }

          if(eof) activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof, acknowledge)=> {
            if(acknowledge) acknowledge('ack');

            log('[Activity module] Returned value: ', data);
            if(eof) setTimeout(()=>{activity_of_service.close()}, 1500);
          });
        });
      }
    });
    // **** Activity Module Test End ****
  })
});

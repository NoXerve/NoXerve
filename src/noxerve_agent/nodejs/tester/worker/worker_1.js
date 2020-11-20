/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

 'use strict';

process.on('disconnect', ()=> {
  process.exit();
});

const Node = new(require('../../node'))();
const NSDT = new(require('../../nsdt'))();
const Worker = new(require('../../worker'))();
const FS = require('fs');

const static_global_random_seed_4096bytes = FS.readFileSync('./static_global_random_seed_4096bytes');
const my_worker_id = 1;
console.log('[Worker ' + my_worker_id + '] static_global_random_seed_4096bytes.', static_global_random_seed_4096bytes);

const my_worker_detail = {
  name: 'worker 1'
};

const my_worker_interfaces = [{
  interface_name: 'WebSocket',
  interface_settings: {
    host: '0.0.0.0',
    port: 9991
  }
},
{
  interface_name: 'WebSocket',
  interface_settings: {
    host: '0.0.0.0',
    port: 6661
  }
}];

let worker_peers_settings = {
  1: {
    connectors_settings: [{
      interface_name: 'WebSocket',
      connector_settings: {
        host: '0.0.0.0',
        port: 9991
      }
    },
    {
      interface_name: 'WebSocket',
      connector_settings: {
        host: '0.0.0.0',
        port: 6661
      }
    }],
    detail: {
      name: 'worker 1'
    }
  },
  2: {
    connectors_settings: [{
      interface_name: 'WebSocket',
      connector_settings: {
        host: '0.0.0.0',
        port: 9992
      }
    },
    {
      interface_name: 'WebSocket',
      connector_settings: {
        host: '0.0.0.0',
        port: 6662
      }
    }],
    detail: {
      name: 'worker 2'
    }
  }
};

let index = 0;

const initialize_interfaces = (callback)=> {
  const _interface = my_worker_interfaces[index];
  Node.createInterface(_interface.interface_name, _interface.interface_settings, (err, id) => {
    if (err) console.log('[Node module] Create interface error.', err);
    loop_next(callback);
  })
};

const loop_next = (callback)=> {
  // console.log(index, interfaces.length);
  index++;
  if(index < my_worker_interfaces.length) {
    initialize_interfaces(callback);
  }
  else {
    // console.log(index, interfaces.length);
    callback();
  }
};

initialize_interfaces(()=> {
  console.log('[Worker ' + my_worker_id + '] initialize_interfaces ok.');

  const Protocol = new(require('../../protocol'))({
    modules: {
      worker: Worker,
      nsdt: NSDT
    },
    node_module: Node
  });

  Protocol.start((error)=> {
    if(error) console.log('[Worker ' + my_worker_id + '] "protocol start" error. ', error);
    Node.start((error) => {
      if(error) console.log('[Worker ' + my_worker_id + '] "node start" error. ', error);
      Worker.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error)=> {
        if (error) console.log('[Worker ' + my_worker_id + '] importStaticGlobalRandomSeed error.', error);
        Worker.importMyWorkerAuthenticityData(my_worker_id, 'whatsoever_auth1', (error)=> {
          if (error) console.log('[Worker ' + my_worker_id + '] importMyWorkerAuthenticityData error.', error);
          Worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
            if (error) console.log('[Worker ' + my_worker_id + '] importWorkerPeersSettings error.', error);
            Worker.start((error)=> {
              if(error) console.log('[Worker ' + my_worker_id + '] "worker start" error. ', error);
              let the_worker_group;
              let the_worker_group_var;

              Worker.on('worker-peer-authenticate', (worker_id, worker_authenticity_information, is_valid)=> {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-authenticate" event. ', worker_id, worker_authenticity_information);
                if(worker_id === 0 && worker_authenticity_information === 'join_me_auth') {
                  // Initailize new worker.
                  is_valid(true);
                }
                else if(worker_authenticity_information === 'whatsoever_auth'+worker_id) {
                  is_valid(true);
                }
                else {
                  is_valid(false);
                }
              });

              Worker.on('worker-peer-join', (new_worker_peer_id, new_worker_peer_connectors_settings, new_worker_peer_detail, next) => {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-join" event.', new_worker_peer_id, new_worker_peer_connectors_settings, new_worker_peer_detail);
                const on_confirm = (next_of_confirm)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-join" confirm.');
                  next_of_confirm(false);
                };
                const on_cancel = (next_of_cancel)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-join" cancel.');
                  next_of_cancel(false);
                };
                next(false, on_confirm, on_cancel);
              });

              Worker.on('worker-peer-update', (remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail, next) => {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-update" event.', remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail);
                const on_confirm = (next_of_confirm)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-update" confirm.');
                  next_of_confirm(false);
                };
                const on_cancel = (next_of_cancel)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-update" cancel.');
                  next_of_cancel(false);
                };
                next(false, on_confirm, on_cancel);
              });

              Worker.on('worker-peer-leave', (remote_worker_peer_id, next) => {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-leave" event.', remote_worker_peer_id);
                const on_confirm = (next_of_confirm)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-leave" confirm.');
                  next_of_confirm(false);
                };
                const on_cancel = (next_of_cancel)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-leave" cancel.');
                  next_of_cancel(false);
                };
                next(false, on_confirm, on_cancel);
              });

              process.on('message', (msg)=> {
                if(msg === '4') {
                  Worker.getWorkerPeerDetail(3, (error, detail) => {
                    if (error) {
                      console.log('[Worker ' + my_worker_id + '] getWorkerPeerDetail error.', error);
                    }
                    console.log('[Worker ' + my_worker_id + '] getWorkerPeerDetail.', detail);
                  });
                  Worker.createWorkerSocket('purpose 1', {p: 1}, 3, (error, worker_socket)=> {
                    if (error) {
                      console.log('[Worker ' + my_worker_id + '] createWorkerSocket error.', error);
                    }
                    else {
                      worker_socket.on('close', () => {
                        console.log('[Worker ' + my_worker_id + '] WorkerSocket from createWorkerSocket closed.');
                      });
                      worker_socket.define('func1', (service_function_parameter, return_data, yield_data) => {
                        console.log('[Worker ' + my_worker_id + '] WorkerSocket function on createWorkerSocket called.');
                        const callable_struture = NSDT.createCallableStructure({haha: (callback)=> {
                          console.log('[NSDT module] NSDT haha called.');
                          const callable_struture_2 = NSDT.createCallableStructure({nah: ()=> {}});
                          callback(callable_struture, callable_struture_2, 321);
                        }});

                        callable_struture.on('close', ()=> {
                          console.log('[NSDT module] NSDT haha closed.');
                        });

                        yield_data(callable_struture);

                        yield_data(123);
                        yield_data({foo: 123}, (acknowledge_message_bytes)=> {
                          console.log('[Worker module] WorkerSocket function on createWorkerSocket. acknowledge_message_bytes', acknowledge_message_bytes);
                          yield_data(Buffer.from([5, 4, 3, 2, 1]));
                          return_data('haha');
                        });
                      });
                      worker_socket.call('func2', {foo: 'call from createWorkerSocket'}, (err, data, eof)=> {
                        console.log('[Worker ' + my_worker_id + '] "func2" Return value: ', data);
                        if(eof) console.log('finished worker_func2_call_test');
                      });
                      worker_socket.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
                        console.log('[Worker ' + my_worker_id + '] "field1" handleYielding started.');
                        console.log('[Worker ' + my_worker_id + '] Parameters value: ', yielding_handler_parameter);
                        ready_yielding('"field1" ok for yielding.', (error, data, eof, acknowledge)=> {
                          if(error) console.log('[Worker ' + my_worker_id + '] "field1" Yielding error.', error);
                          console.log('[Worker ' + my_worker_id + '] "field1" Yielded value: ', data);
                          if(acknowledge) acknowledge('ack');
                          if(eof) {
                            console.log('finished worker_field1_yield_test');
                            setTimeout(()=>{worker_socket.close()}, 1500);
                          };
                        });
                      });
                      worker_socket.startYielding('field2', 'yield from createWorkerSocket', (error, yielding_start_parameter, finish_yield, yield_data) => {
                        if (error) console.log('[Worker ' + my_worker_id + '] "field2" Yield error.', error);
                        console.log('[Worker ' + my_worker_id + '] "field2" yielding_start_parameter value: ', yielding_start_parameter);

                        yield_data(123);
                        yield_data({foo: 123});
                        yield_data(Buffer.from([5, 4, 3, 2, 1]));
                        finish_yield('haha');
                      });
                      console.log('[Worker ' + my_worker_id + '] createWorkerSocket OK.', worker_socket);
                    }
                  });
                }
                else if(msg === '5') {
                  Worker.createWorkerGroup('test_group', [2, 1], (error, worker_group) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] createWorkerGroup error.', error);
                    the_worker_group = worker_group;
                    worker_group.createVariable('the_var', (error, variable) => {
                      if (error) console.log('[Worker ' + my_worker_id + '] createVariable error.', error);
                      variable.on('update', (group_peer_id, value)=> {
                        console.log('[Worker ' + my_worker_id + '] Variable update event (group_peer_id/value):', group_peer_id, value);
                      });
                      the_worker_group_var = variable;
                    });
                  });
                }
                else if(msg === '7') {
                  the_worker_group_var.getValue((error, value) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] getValue error.', error);
                    console.log('[Worker ' + my_worker_id + '] getValue :', value);
                  });
                }
                else if(msg === '8') {
                  the_worker_group_var.updateValue('<Worker ' + my_worker_id + '> '+Math.random(), (error) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] update error.', error);
                  });
                }
                else if(msg === '11') {
                  process.exit();
                }
              });
              process.send('ready');
            });
          });
        });
      });
    });
  });
});

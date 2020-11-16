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
const my_worker_id = 2;

console.log('[Worker ' + my_worker_id + '] static_global_random_seed_4096bytes.', static_global_random_seed_4096bytes);

const my_worker_detail = {
  name: 'worker 2'
};

const my_worker_interfaces = [{
  interface_name: 'WebSocket',
  interface_settings: {
    host: '0.0.0.0',
    port: 9992
  }
},
{
  interface_name: 'WebSocket',
  interface_settings: {
    host: '0.0.0.0',
    port: 6662
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
        Worker.importMyWorkerAuthenticityData(my_worker_id, 'whatsoever_auth2', (error)=> {
          if (error) console.log('[Worker ' + my_worker_id + '] importMyWorkerAuthenticityData error.', error);
          Worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
            if (error) console.log('[Worker ' + my_worker_id + '] importWorkerPeersSettings error.', error);
            let the_worker_group;
            let the_worker_group_var;

            Worker.start((error)=> {
              if(error) console.log('[Worker ' + my_worker_id + '] "worker start" error. ', error);
              Worker.on('worker-peer-authentication', (worker_id, worker_authenticity_information, is_valid)=> {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-authentication" event. ', worker_id, worker_authenticity_information);
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
                const on_cancel = (next_of_cancel)=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-join" cancel.');
                  next_of_cancel(false);
                };
                next(false, on_cancel);
              });

              Worker.on('worker-peer-update', (remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail, next) => {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-update" event.', remote_worker_peer_id, remote_worker_peer_connectors_settings, remote_worker_peer_detail);
                const on_cancel = ()=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-update" cancel.');
                  next_of_cancel(false);
                };
                next(false, on_cancel);
              });

              Worker.on('worker-peer-leave', (remote_worker_peer_id, next) => {
                console.log('[Worker ' + my_worker_id + '] "worker-peer-leave" event.', remote_worker_peer_id);
                const on_cancel = ()=> {
                  console.log('[Worker ' + my_worker_id + '] "worker-peer-leave" cancel.');
                  next_of_cancel(false);
                };
                next(false, on_cancel);
              });

              Worker.onWorkerSocketCreate('purpose 1', (parameter, remote_worker_id, worker_socket)=> {
                console.log('[Worker ' + my_worker_id + '] onWorkerSocketCreate OK.', parameter, remote_worker_id, worker_socket);
                worker_socket.on('close', () => {
                  console.log('[Worker ' + my_worker_id + '] WorkerSocket from onWorkerSocketCreate closed.');
                });
                worker_socket.define('func2', (service_function_parameter, return_data, yield_data) => {
                  console.log('[Worker ' + my_worker_id + '] WorkerSocket function on createWorkerSocket called.');
                  yield_data(321);
                  yield_data({foo: 321});
                  yield_data(Buffer.from([5, 4, 3, 0, 1]));
                  return_data('hehe');
                });
                worker_socket.call('func1', {foo: 'call from onWorkerSocketCreate'}, (err, data, eof)=> {
                  console.log('[Worker ' + my_worker_id + '] "func1" Return value: ', data);
                  if(eof) console.log('finished worker_func1_call_test');
                });
                worker_socket.handleYielding('field2', (yielding_handler_parameter, ready_yielding) => {
                  console.log('[Worker ' + my_worker_id + '] "field2" handleYielding started.');
                  console.log('[Worker ' + my_worker_id + '] Parameters value: ', yielding_handler_parameter);
                  ready_yielding('"field2" ok for yielding.', (error, data, eof)=> {
                    if(error) console.log('[Worker ' + my_worker_id + '] "field1" Yielding error.', error);
                    console.log('[Worker ' + my_worker_id + '] "field2" Yielded value: ', data);
                    if(eof) {
                      console.log('finished worker_field2_yield_test');
                    };
                  });
                });
                worker_socket.startYielding('field1', 'yield from createWorkerSocket', (error, yielding_start_parameter, finish_yield, yield_data) => {
                  if (error) console.log('[Worker ' + my_worker_id + '] "field1" Yield error.', error);
                  console.log('[Worker ' + my_worker_id + '] "field1" yielding_start_parameter value: ', yielding_start_parameter);

                  yield_data(321);
                  yield_data({foo: 321});
                  yield_data(Buffer.from([5, 4, 3, 0, 1]));
                  finish_yield('hehe');
                });
              });
              process.on('message', (msg)=> {
                if(msg === '5') {
                  Worker.createWorkerGroup('test_group', [2, 1], (error, worker_group) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] createWorkerGroup error.', error);
                    the_worker_group = worker_group;
                    worker_group.createVariable('the_var', (error, variable) => {
                      if (error) console.log('[Worker ' + my_worker_id + '] createVariable error.', error);
                      the_worker_group_var = variable;
                    });
                  });
                }
                else if(msg === '6') {
                  the_worker_group_var.updateValue('[Worker ' + my_worker_id + ']', (error) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] update error.', error);
                  });
                }
                else if(msg === '9') {
                  the_worker_group_var.getValue((error, value) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] getValue error.', error);
                    console.log('[Worker ' + my_worker_id + '] getValue :', value);
                  });
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

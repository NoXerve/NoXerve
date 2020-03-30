/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

process.on('disconnect', ()=> {
  process.exit();
});

const Node = new(require('../../node'))();
const Worker = new(require('../../worker'))();

const my_worker_id = 1;

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
    interfaces: [{
      interface_name: 'WebSocket',
      interface_connect_settings: {
        host: '0.0.0.0',
        port: 9991
      }
    },
    {
      interface_name: 'WebSocket',
      interface_connect_settings: {
        host: '0.0.0.0',
        port: 6661
      }
    }],
    detail: {
      name: 'worker 1'
    }
  },
  2: {
    interfaces: [{
      interface_name: 'WebSocket',
      interface_connect_settings: {
        host: '0.0.0.0',
        port: 9992
      }
    },
    {
      interface_name: 'WebSocket',
      interface_connect_settings: {
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
      worker: Worker
    },
    node_module: Node
  });

  Protocol.start();

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

  Worker.on('worker-peer-join', (new_worker_peer_id, new_worker_peer_interfaces, new_worker_peer_detail, next) => {
    console.log('[Worker ' + my_worker_id + '] "worker-peer-join" event.', new_worker_peer_id, new_worker_peer_interfaces, new_worker_peer_detail);
    next(false, ()=> {

    });
  });

  Worker.on('worker-peer-update', (remote_worker_peer_id, remote_worker_peer_interfaces, remote_worker_peer_detail, next) => {
    console.log('[Worker ' + my_worker_id + '] "worker-peer-update" event.', remote_worker_peer_id, remote_worker_peer_interfaces, remote_worker_peer_detail);
    next(false, ()=> {

    });
  });

  Worker.on('worker-peer-leave', (remote_worker_peer_id, next) => {
    console.log('[Worker ' + my_worker_id + '] "worker-peer-leave" event.', remote_worker_peer_id);
    next(false, ()=> {

    });
  });

  Worker.importMyWorkerAuthenticityData(my_worker_id, 'whatsoever_auth1', (error)=> {
    if (error) console.log('[Worker ' + my_worker_id + '] importMyWorkerAuthenticityData error.', error);
    Worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
      if (error) console.log('[Worker ' + my_worker_id + '] importWorkerPeersSettings error.', error);
      process.on('message', (msg)=> {
        if(msg === 'execTest') {
          Worker.createWorkerSocket('purpose 1', {p: 1}, 2, (error, worker_socket)=> {
            if (error) {
              console.log('[Worker module] createWorkerSocket error.', error);
            }
            else {
              worker_socket.on('close', () => {
                console.log('[Worker module] WorkerSocket from createWorkerSocket closed.');
              });
              worker_socket.define('func1', (service_function_parameter, return_data, yield_data) => {
                console.log('[Worker module] WorkerSocket function on createWorkerSocket called.');
                yield_data(123);
                yield_data({foo: 123});
                yield_data(Buffer.from([5, 4, 3, 2, 1]));
                return_data('haha');
              });
              worker_socket.call('func2', {foo: 'call from createWorkerSocket'}, (err, data, eof)=> {
                console.log('[Worker module] "func2" Return value: ', data);
                if(eof) console.log('finished worker_func2_call_test');
              });
              worker_socket.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
                console.log('[Worker module] "field1" handleYielding started.');
                console.log('[Worker module] Parameters value: ', yielding_handler_parameter);
                ready_yielding('"field1" ok for yielding.', (error, data, eof)=> {
                  if(error) console.log('[Worker module] "field1" Yielding error.', error);
                  console.log('[Worker module] "field1" Yielded value: ', data);
                  if(eof) {
                    console.log('finished worker_field1_yield_test');
                    setTimeout(()=>{worker_socket.close()}, 1500);
                  };
                });
              });
              worker_socket.startYielding('field2', 'yield from createWorkerSocket', (error, yielding_start_parameter, finish_yield, yield_data) => {
                if (error) console.log('[Worker module] "field2" Yield error.', error);
                console.log('[Worker module] "field2" yielding_start_parameter value: ', yielding_start_parameter);

                yield_data(123);
                yield_data({foo: 123});
                yield_data(Buffer.from([5, 4, 3, 2, 1]));
                finish_yield('haha');
              });
              console.log('[Worker module] createWorkerSocket OK.', worker_socket);
            }
          });
        }
      });
      process.send('ready');
    });
  });
});

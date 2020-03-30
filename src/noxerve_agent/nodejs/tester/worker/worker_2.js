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

const my_worker_id = 2;

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
    detail: {}
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
    detail: {}
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

  Worker.on('worker-peer-join', (remote_worker_id, worker_interfaces, my_worker_detail, on_cancel)=> {
    on_cancel(()=> {

    });
  });

  Worker.on('worker-peer-update', (remote_worker_id, worker_interfaces, my_worker_detail, on_cancel)=> {
    on_cancel(()=> {

    });
  });

  Worker.on('worker-peer-leave', (remote_worker_id, on_cancel)=> {
    on_cancel(()=> {

    });
  });

  Worker.importMyWorkerAuthenticityData(my_worker_id, 'whatsoever_auth2', (error)=> {
    if (error) console.log('[Worker ' + my_worker_id + '] importMyWorkerAuthenticityData error.', error);
    Worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
      if (error) console.log('[Worker ' + my_worker_id + '] importWorkerPeersSettings error.', error);

      Worker.onWorkerSocketCreate('purpose 1', (parameters, remote_worker_id, worker_socket)=> {
        console.log('[Worker ' + my_worker_id + '] onWorkerSocketCreate OK.', parameters, remote_worker_id, worker_socket);
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
      process.send('ready');
    });
  });
});

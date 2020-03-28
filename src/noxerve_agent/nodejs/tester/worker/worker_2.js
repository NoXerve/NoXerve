/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

const readline = require("readline");
const Node = new(require('../../node'))();
const Worker = new(require('../../worker'))();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


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

let worker_peers_settings = {};

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

  Worker.on('worker-authentication', (worker_id, worker_authenticity_information, next)=> {
    if(worker_id === 0) {
      // Initailize new worker.
    }
    console.log('[Worker ' + my_worker_id + '] "worker-authentication" event. ', worker_id, worker_authenticity_information);
    next(true);
  });

  Worker.on('worker-join', (remote_worker_id, worker_interfaces, my_worker_detail, on_undo)=> {
    on_undo(()=> {

    });
  });

  Worker.on('worker-update', (remote_worker_id, worker_interfaces, my_worker_detail, on_undo)=> {
    on_undo(()=> {

    });
  });

  Worker.on('worker-leave', (remote_worker_id, on_undo)=> {
    on_undo(()=> {

    });
  });

  Worker.importWorkerAuthenticityData(my_worker_id, 'whatsoever_auth', (error)=> {
    if (error) console.log('[Worker ' + my_worker_id + '] importWorkerAuthenticityData error.', error);
    Worker.importWorkerPeersSettings(worker_peers_settings, (error) => {
      if (error) console.log('[Worker ' + my_worker_id + '] importWorkerPeersSettings error.', error);

      rl.question('Waiting for other workers. If workers are ready then input any thing to continue tesing.', ()=> {

      });
    });
  });
});

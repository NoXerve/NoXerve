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


const my_worker_id = 0;

const worker_1_interfaces_for_joining_me = [{
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
  }
];

const my_worker_detail = {
  name: 'worker 3'
};

const my_worker_interfaces = [{
    interface_name: 'WebSocket',
    interface_settings: {
      host: '0.0.0.0',
      port: 9993
    }
  },
  {
    interface_name: 'WebSocket',
    interface_settings: {
      host: '0.0.0.0',
      port: 6663
    }
  }
];


// This worker is not joined yet.
let worker_peers_settings = {};

let index = 0;

const initialize_interfaces = (callback) => {
  const _interface = my_worker_interfaces[index];
  Node.createInterface(_interface.interface_name, _interface.interface_settings, (err, id) => {
    if (err) console.log('[Node module] Create interface error.', err);
    loop_next(callback);
  })
};

const loop_next = (callback) => {
  // console.log(index, interfaces.length);
  index++;
  if (index < my_worker_interfaces.length) {
    initialize_interfaces(callback);
  } else {
    // console.log(index, interfaces.length);
    callback();
  }
};

initialize_interfaces(() => {
  console.log('[Worker ' + my_worker_id + '] initialize_interfaces ok.');

  const Protocol = new(require('../../protocol'))({
    modules: {
      worker: Worker
    },
    node_module: Node
  });

  Protocol.start();

  Worker.on('worker-authentication', (worker_id, worker_authenticity_information, is_valid)=> {
    console.log('[Worker ' + my_worker_id + '] "worker-authentication" event. ', worker_id, worker_authenticity_information);
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

  Worker.on('worker-join', (remote_worker_id, worker_interfaces, my_worker_detail, on_undo) => {
    on_undo(() => {

    });
  });

  Worker.on('worker-update', (remote_worker_id, worker_interfaces, my_worker_detail, on_undo) => {
    on_undo(() => {

    });
  });

  Worker.on('worker-leave', (remote_worker_id, on_undo) => {
    on_undo(() => {

    });
  });

  rl.question('Waiting for other workers. If workers are ready then input any thing to continue tesing.', () => {
    Worker.joinMe(worker_1_interfaces_for_joining_me, my_worker_interfaces,
      my_worker_detail, 'join_me_auth',
      (error, _worker_id, _worker_peers_settings) => {
        if(error) console.log('[Worker ' + my_worker_id + '] joinMe error.', error);
        else {
          worker_peers_settings = _worker_peers_settings;
          Worker.importWorkerAuthenticityData(_worker_id, 'whatsoever_auth', (error) => {
            if (error) console.log('[Worker ' + my_worker_id + '] importWorkerAuthenticityData error.', error);

          });
        }
      });
  });

});

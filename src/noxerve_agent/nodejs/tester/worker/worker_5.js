/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

 'use strict';

 process.on('disconnect', ()=> {
   process.exit();
 });

const Node = new(require('../../node'))();
const NSDT = new(require('../../nsdt'))();
const Worker = new(require('../../worker'))();

let my_worker_id = 0;

const worker_1_interfaces_for_joining_me = [{
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
  }
];

const my_worker_detail = {
  name: 'worker 4'
};

const my_worker_interfaces = [{
    interface_name: 'WebSocket',
    interface_settings: {
      host: '0.0.0.0',
      port: 9995
    }
  },
  {
    interface_name: 'WebSocket',
    interface_settings: {
      host: '0.0.0.0',
      port: 6665
    }
  }
];

const my_worker_connectors_settings = [{
    interface_name: 'WebSocket',
    connector_settings: {
      host: '0.0.0.0',
      port: 9995
    }
  },
  {
    interface_name: 'WebSocket',
    connector_settings: {
      host: '0.0.0.0',
      port: 6665
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
      worker: Worker,
      nsdt: NSDT
    },
    node_module: Node
  });

  Protocol.start((error)=> {
    if(error) console.log('[Worker ' + my_worker_id + '] "protocol start" error. ', error);
    Node.start((error) => {
      if(error) console.log('[Worker ' + my_worker_id + '] "node start" error. ', error);
      Worker.start((error)=> {
        if(error) console.log('[Worker ' + my_worker_id + '] "worker start" error. ', error);
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
          if(msg === '11') {
            Worker.joinMe(worker_1_interfaces_for_joining_me, my_worker_connectors_settings,
              my_worker_detail, 'join_me_auth',
              (error, _worker_id, _worker_peers_settings, static_global_random_seed_4096bytes) => {
                if(error) console.log('[Worker ' + my_worker_id + '] joinMe error.', error);
                else {
                  my_worker_id = _worker_id;
                  console.log('[Worker ' + my_worker_id + '] new worker settings.', _worker_id, JSON.stringify(_worker_peers_settings, null, 2));
                  console.log('[Worker ' + my_worker_id + '] obtained static_global_random_seed_4096bytes.', static_global_random_seed_4096bytes);
                  worker_peers_settings = _worker_peers_settings;
                  Worker.importMyWorkerAuthenticityData(_worker_id, 'whatsoever_auth'+my_worker_id, (error) => {
                    if (error) console.log('[Worker ' + my_worker_id + '] importMyWorkerAuthenticityData error.', error);

                  });
                }
              });
          }
        });
        process.send('ready');
      });
    });
  });
});

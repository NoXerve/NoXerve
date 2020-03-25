/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

let Node = new(require('../../node'))();
let Worker = new(require('../../worker'))();

let Protocol = new(require('../../protocol'))({
  modules: {
    worker: Worker
  },
  node_module: Node
});

Protocol.start();

Node.createInterface('WebSocket', {
  host: '0.0.0.0',
  port: 9991
}, (err, id) => {
  if (err) console.log('[Node module] Create interface error.', err);
  Node.createInterface('WebSocket', {
    host: '0.0.0.0',
    port: 6661
  }, (err, id) => {
    if (err) console.log('[Node module] Create interface error.', err);
  })
})


Worker.importWorkerAuthenticityData(1, 'whatsoever_auth', ()=> {
  Worker.importWorkerIdToInterfacesMapping();
  Worker.createWorkerSocket('purpose 1', remote_worker_id, (error, worker_socket)=> {

  });
});

Worker.on('worker-authenticication', (worker_id, worker_authenticity_information)=> {
  if(worker_id === 0) {
    // Initailize new worker.
  }
  console.log('worker_authenticity_information', worker_authenticity_information);
  return true;
});

const interfaces = [];
Worker.joinMe(interfaces, 'whatsoever_auth', (error, my_worker_id)=> {

});

Worker.updateMe(interfaces, (error, my_worker_id)=> {

});

Worker.leaveMe(interfaces, (error, my_worker_id)=> {

});

Worker.on('worker-join', (remote_worker_id, worker_interfaces)=> {

});

Worker.on('worker-update', (remote_worker_id, worker_interfaces)=> {

});

Worker.on('worker-leave', (remote_worker_id, worker_interfaces)=> {

});

Worker.onWorkerSocketCreate('purpose 1', (remote_worker_id, worker_socket)=> {

});

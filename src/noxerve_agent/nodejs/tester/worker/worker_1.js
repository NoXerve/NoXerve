/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

let Node = new(require('../../node'))();
let Worker = new(require('../../worker'))();

const worker_detail = {
  name: 'worker 1'
};
const interfaces = [{
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

let worker_id_to_interfaces_dict = {
  1: [{
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
  }]
};

let index = 0;

const loop = (callback)=> {
  const _interface = interfaces[index];
  Node.createInterface(_interface.interface_name, _interface.interface_settings, (err, id) => {
    if (err) console.log('[Node module] Create interface error.', err);
    loop_next(callback);
  })
};

const loop_next = (callback)=> {
  // console.log(index, interfaces.length);
  index++;
  if(index < interfaces.length) {
    loop(callback);
  }
  else {
    // console.log(index, interfaces.length);
    callback();
  }
};

loop(()=> {
  let Protocol = new(require('../../protocol'))({
    modules: {
      worker: Worker
    },
    node_module: Node
  });

  Protocol.start();

  Worker.importWorkerAuthenticityData(1, 'whatsoever_auth', ()=> {
    Worker.importWorkerIdToInterfacesMapping(worker_id_to_interfaces_dict, () => {
      Worker.onWorkerSocketCreate('purpose 1', (parameters, remote_worker_id, worker_socket)=> {

      });

      Worker.createWorkerSocket('purpose 1', parameters, remote_worker_id, (error, worker_socket)=> {

      });
    });
  });

  Worker.on('worker-authenticication', (worker_id, worker_authenticity_information)=> {
    if(worker_id === 0) {
      // Initailize new worker.
    }
    console.log('worker_authenticity_information', worker_authenticity_information);
    return true;
  });

  Worker.joinMe(interfaces, worker_detail, 'whatsoever_auth', (error, my_worker_id)=> {

  });

  Worker.on('worker-join', (remote_worker_id, worker_interfaces, worker_detail)=> {

  });

  Worker.updateMe(interfaces, worker_detail, (error, my_worker_id)=> {

  });

  Worker.on('worker-update', (remote_worker_id, worker_interfaces, worker_detail)=> {

  });

  Worker.leaveMe((error, my_worker_id)=> {

  });


  Worker.on('worker-leave', (remote_worker_id)=> {

  });
});

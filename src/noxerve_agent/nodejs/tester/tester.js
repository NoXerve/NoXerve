/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

console.log('[Tester] Start testing...');

let Tests = [
  'node_connector_send_test',
  'node_interface_send_test',
  'activity_test',
  'service_function_test',
  'service_yield_test',
  'worker_test',
  'other_test'
];

let test_count = Tests.length;

let finish = (test_name) => {
  let index = Tests.indexOf(test_name);
  if (index !== -1) Tests.splice(index, 1);
  console.log('[Tester] Progress: '+(test_count-Tests.length)+'/'+test_count+'. Finished "'+test_name+'" test.');
  if (!Tests.length) {
    console.log('[Tester] Test finished. Executed all tests. Validate your test from printed result.');
    process.exit();
  }
};

let NSDT = require('../nsdt');
let NoXerveAgent = new(require('../index'))({});
let Node = new(require('../node'))();
let Node2 = new(require('../node'))();
let Activity = new(require('../service/activity'))();
let Service = new(require('../service/service'))();
let Worker = new(require('../worker'))();

let Protocol = new(require('../protocol'))({
  modules: {
    activity: Activity,
    service: Service,
    worker: Worker
  },
  node_module: Node2
});
let Utils = require('../utils');

console.log('[Utils module] random8Bytes ', Utils.random8Bytes());
console.log('[NSDT module] ', NSDT.decode(NSDT.encode({
  host: '0.0.0.0',
  port: 12345
})));
finish('other_test');

console.log('[Node module] NoXerveAgent Object: ', NoXerveAgent);
console.log('[Node module] Node Object: ', Node);
console.log('[Node module] Protocol Object: ', Protocol);


// **** Node Module Test Start ****

console.log('[Node module] Preparing test...');

// Test created tunnel either from "createTunnel" function or "create-tunnel" event.
let tunnel_test = (tunnel) => {
  if (tunnel.returnValue('from_connector')) console.log('[Node module] Tunnel created from connector.');
  if (tunnel.returnValue('from_interface')) console.log('[Node module] Tunnel created from interface.');
  tunnel.on('ready', () => {
    if (tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector. Ready.');
      tunnel.send('Sent from connector.', (error) => {
        console.log('[Node module] "Sent from interface." sent.');
      });
    }
    if (tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface. Ready.');
      tunnel.send('Sent from interface.', (error) => {
        console.log('[Node module] "Sent from interface." sent.');
      });
    }
  });
  tunnel.on('data', (data) => {
    if (tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector received data: "', data, '"');
      finish('node_interface_send_test');
    }
    if (tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface received data: "', data, '"');
      finish('node_connector_send_test');
    }
  });
  tunnel.on('close', () => {
    if (tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector closed.');
    }
    if (tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface closed.');
    }
  });
  tunnel.on('error', (error) => {
    console.log('[Node module] Tunnel error.', error);
  });

};
Node.on('tunnel-create', tunnel_test)
console.log('[Node module] Create interface.');
Node.createInterface('WebSocket', {
  host: '0.0.0.0',
  port: 1234
}, (err, id) => {
  if (err) console.log('[Node module] Create interface error.', err);
  console.log('[Node module] Create tunnel.');
  Node.createTunnel('WebSocket', {
    host: '0.0.0.0',
    port: 1234
  }, (err, tunnel) => {
    if (err) console.log('[Node module] Create tunnel error.', err)
    else {
      tunnel_test(tunnel);
    }
  });
})

// **** Node Module Test End ****

// **** Protocol Module Test Start ****
Protocol.start();
// **** Protocol Module Test End ****


Node2.createInterface('WebSocket', {
  host: '0.0.0.0',
  port: 12345
}, (err, id) => {
  if (err) console.log('[Node2 module] Create interface error.', err);

  // **** Worker Module Test Start ****

  let workers_settings = {
    1: {
      interfaces: [{
        interface_name: 'WebSocket',
        interface_connect_settings: {
          host: '0.0.0.0',
          port: 12345
        }
      }],
      detail: {}
    }
  };

  Worker.importWorkerAuthenticityData(1, 'whatsoever_auth', (error)=> {
    if (error) console.log('[Worker module] importWorkerAuthenticityData error.', error);
    Worker.importWorkersSettings(workers_settings, (error)=> {
      if (error) console.log('[Worker module] importWorkersSettings error.', error);
      Worker.on('worker-authenticication', (worker_id, worker_authenticity_information)=> {
        if(worker_id === 0) {
          // Initailize new worker.
        }
        console.log('[Worker module] "worker-authenticication" event. ', worker_id, worker_authenticity_information);
        return true;
      });

      Worker.onWorkerSocketCreate('purpose 1', (parameters, remote_worker_id, worker_socket)=> {

        console.log(parameters, remote_worker_id, worker_socket);
      });

      Worker.createWorkerSocket('purpose 1', {p: 1}, 1, (error, worker_socket)=> {
        if (error) console.log('[Worker module] createWorkerSocket error.', error);
        finish('worker_test');
      });
    });
  });

  // **** Worker Module Test End ****

  // **** Service Module Test Start ****
  Service.on('connect', (service_of_activity) => {
    console.log('[Service module] Activity created.');
    service_of_activity.on('close', ()=> {
      console.log('[Service module] Service closed.');
    });
    service_of_activity.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
      console.log('[Service module] Service handleYielding started.');
      console.log('[Service module] Parameters value: ', yielding_handler_parameter);
      ready_yielding('service ok for yielding.', (error, data, eof)=> {
        if(error) console.log('[Service module] Yielding error.', error);
        console.log('[Service module] Yielded value: ', data);
        if(eof) finish('service_yield_test');
      });
    });
    service_of_activity.define('test_func', (service_function_parameter, return_data, yield_data) => {
      console.log('[Service module] Service function called.');
      console.log('[Service module] Parameters value: ', service_function_parameter);
      // service_of_activity.close();
      yield_data({bar: 13579});
      yield_data(Utils.random8Bytes());
      yield_data(Buffer.from([1, 2, 3, 4, 5]));
      return_data({bar: 'last round'});
      finish('service_function_test');
    });
  });
  // **** Service Module Test End ****

  console.log('[Activity module] Activity create test.');

  // **** Activity Module Test Start ****
  Activity.createActivity([{
    interface_name: 'WebSocket',
    interface_connect_settings: {
      host: '0.0.0.0',
      port: 12345
    }
  }], (error, activity_of_service) => {

    if (error) console.log('[Activity module] Activity create error.', error);
    else {
      console.log('[Activity module] Activity created.');
      activity_of_service.on('close', () => {
        console.log('[Activity module] Activity closed.');
        finish('activity_test');
      });
      activity_of_service.startYielding('field1', 'yield from activity', (error, yielding_start_parameter, finish_yield, yield_data) => {
        if (error) console.log('[Activity module] Yield error.', error);
        console.log('[Activity module] yielding_start_parameter value: ', yielding_start_parameter);

        yield_data(123);
        yield_data({foo: 123});
        yield_data(Buffer.from([5, 4, 3, 2, 1]));
        finish_yield('haha');
      });
      activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof)=> {
        console.log('[Activity module] Return value: ', data);
        if(eof) activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof)=> {
          console.log('[Activity module] Returned value: ', data);
          if(eof) setTimeout(()=>{activity_of_service.close()}, 1500);
        });
      });
    }
  });
  // **** Activity Module Test End ****
})

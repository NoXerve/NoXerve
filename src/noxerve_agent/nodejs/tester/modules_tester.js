/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

'use strict';

const fs = require('fs');

console.log('[Tester] Start testing...');

let Tests = [
  'node_connector_send_test',
  'node_interface_send_test',
  'activity_test',
  'service_function_test',
  'service_yield_test',
  'worker_test',
  'worker_func1_call_test',
  'worker_func2_call_test',
  'worker_field2_yield_test',
  'worker_field1_yield_test',
  'worker_scope_check_integrity',
  'nsdt_test',
  'other_test'
];

process.on('SIGINT', ()=> {
  console.log('Tests left:', Tests);
  process.exit();
});

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

const NSDT = new(require('../nsdt'))({});
let NoXerveAgent = new(require('../index'))({});
let Node = new(require('../node/secured_node'))({
  rsa_2048_key_pair: {
    public: fs.readFileSync('./public.pem', 'utf8'),
    private: fs.readFileSync('./private.pem', 'utf8'),
  }
});
let Node2 = new(require('../node'))();
let Activity = new(require('../service/activity'))();
let Service = new(require('../service/service'))();
let Worker = new(require('../worker'))();

let Protocol = new(require('../protocol'))({
  modules: {
    activity: Activity,
    service: Service,
    worker: Worker,
    nsdt: NSDT
  },
  node_module: Node2
});
let Utils = require('../utils');

console.log('[Utils module] random8Bytes ', Utils.random8Bytes());
// console.log('[NSDT module] ', NSDT.decode(NSDT.encode({
//   host: '0.0.0.0',
//   port: 12345
// })));
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
      tunnel.send(Buffer.from('Sent from connector.'), (error) => {
        console.log('[Node module] "Sent from interface." sent.');
      });
    }
    if (tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface. Ready.');
      tunnel.send(Buffer.from('Sent from interface.'), (error) => {
        console.log('[Node module] "Sent from interface." sent.');
      });
    }
  });
  tunnel.on('data', (data) => {
    if (tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector received data: "', data.toString('utf8'), '"');
      finish('node_interface_send_test');
    }
    if (tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface received data: "', data.toString('utf8'), '"');
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

Node.start(() => {
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
});


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

  let worker_peers_settings = {
    1: {
      connectors_settings: [{
        interface_name: 'WebSocket',
        connector_settings: {
          host: '0.0.0.0',
          port: 12345
        }
      }],
      detail: {}
    }
  };

  Worker.importMyWorkerAuthenticityData(1, 'whatsoever_auth', (error)=> {
    if (error) console.log('[Worker module] importMyWorkerAuthenticityData error.', error);
    Worker.importWorkerPeersSettings(worker_peers_settings, (error)=> {
      if (error) console.log('[Worker module] importWorkerPeersSettings error.', error);
      Worker.on('worker-peer-authentication', (worker_id, worker_authenticity_information, is_valid)=> {
        if(worker_id === 0) {
          // Initailize new worker.
        }
        console.log('[Worker module] "worker-peer-authentication" event. ', worker_id, worker_authenticity_information);
        is_valid(true);
      });
      Worker.start((error) => {
        if (error) console.log('[Worker module] start error.', error);
        Worker.onWorkerSocketCreate('purpose 1', (parameters, remote_worker_id, worker_socket)=> {
          console.log('[Worker module] onWorkerSocketCreate OK.', parameters, remote_worker_id, worker_socket);
          worker_socket.on('close', () => {
            console.log('[Worker module] WorkerSocket from onWorkerSocketCreate closed.');
            finish('worker_test');
          });
          worker_socket.define('func2', (service_function_parameter, return_data, yield_data) => {
            console.log('[Worker module] WorkerSocket function on createWorkerSocket called.');
            yield_data(321);
            yield_data({foo: 321});
            yield_data(Buffer.from([5, 4, 3, 0, 1]));
            return_data('hehe');
          });
          worker_socket.call('func1', {foo: 'call from onWorkerSocketCreate'}, (err, data, eof, acknowledge)=> {
            console.log('[Worker module] "func1" Return value: ', data);
            if(eof) finish('worker_func1_call_test');
            if(acknowledge) acknowledge('ack');
          });
          worker_socket.handleYielding('field2', (yielding_handler_parameter, ready_yielding) => {
            console.log('[Worker module] "field2" handleYielding started.');
            console.log('[Worker module] Parameters value: ', yielding_handler_parameter);
            ready_yielding('"field2" ok for yielding.', (error, data, eof)=> {
              if(error) console.log('[Worker module] "field1" Yielding error.', error);
              console.log('[Worker module] "field2" Yielded value: ', data);
              if(eof) {
                finish('worker_field2_yield_test');
              };
            });
          });
          worker_socket.startYielding('field1', 'yield from createWorkerSocket', (error, yielding_start_parameter, finish_yield, yield_data) => {
            if (error) console.log('[Worker module] "field1" Yield error.', error);
            console.log('[Worker module] "field1" yielding_start_parameter value: ', yielding_start_parameter);

            yield_data(321);
            yield_data({foo: 321}, (acknowledge_information)=> {
              console.log('[Worker module] "field1" acknowledge_information.', acknowledge_information);
              yield_data(Buffer.from([5, 4, 3, 0, 1]));
              finish_yield('hehe');
            });
          });
        });

        // WorkerSocket test
        Worker.createWorkerSocket('purpose 1', {p: 1}, 1, (error, worker_socket)=> {
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
              yield_data({foo: 123}, (acknowledge_information)=> {
                console.log('[Worker module] WorkerSocket function on createWorkerSocket. acknowledge_information', acknowledge_information);
                yield_data(Buffer.from([5, 4, 3, 2, 1]));
                return_data('haha');
              });
            });
            worker_socket.call('func2', {foo: 'call from createWorkerSocket'}, (err, data, eof)=> {
              console.log('[Worker module] "func2" Return value: ', data);
              if(eof) finish('worker_func2_call_test');
            });
            worker_socket.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
              console.log('[Worker module] "field1" handleYielding started.');
              console.log('[Worker module] Parameters value: ', yielding_handler_parameter);
              ready_yielding('"field1" ok for yielding.', (error, data, eof, acknowledge)=> {
                if(error) console.log('[Worker module] "field1" Yielding error.', error);
                if(acknowledge) acknowledge('ack');
                console.log('[Worker module] "field1" Yielded value: ', data);
                if(eof) {
                  finish('worker_field1_yield_test');
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
            // finish('worker_test');
          }
        });

        // WorkerScope tests
        Worker.createWorkerScope('test_scope', [1], (error, worker_scope) => {
          if (error) console.log('[Worker module] "test_scope" error.', error);
          worker_scope.on('integrity-pass', () => {

          });
          worker_scope.checkIntegrity((error) => {
            if (error) console.log('[Worker module] "checkIntegrity" error.', error);
            finish('worker_scope_check_integrity');
          });
        });
      });
    });
  });

  // **** Worker Module Test End ****

  // **** Service Module Test Start ****
  Service.onActivityCreate('default', (parameter, service_of_activity) => {
    console.log('[Service module] Activity(default) created. parameter: ', parameter);
    service_of_activity.on('close', ()=> {
      console.log('[Service module] Service closed.');
    });
    service_of_activity.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
      console.log('[Service module] Service handleYielding started.');
      console.log('[Service module] Parameters value: ', yielding_handler_parameter);
      ready_yielding('service ok for yielding.', (error, data, eof, acknowledge)=> {
        if(acknowledge) acknowledge('ack');
        if(error) console.log('[Service module] Yielding error.', error);
        console.log('[Service module] Yielded value: ', data);
        if(eof) finish('service_yield_test');
      });
    });
    service_of_activity.define('test_func', (service_function_parameter, return_data, yield_data) => {
      console.log('[Service module] Service function called.');
      console.log('[Service module] Parameters value: ', service_function_parameter);

      const callable_struture = NSDT.createCallableStructure({haha: (callback)=> {
        console.log('[NSDT module] NSDT haha called.');
        const callable_struture_2 = NSDT.createCallableStructure({nah: ()=> {}});
        callback(callable_struture, callable_struture_2, 321);
      }});

      callable_struture.on('close', ()=> {
        console.log('[NSDT module] NSDT haha closed.');
      });
      // service_of_activity.close();
      yield_data({bar: 13579});
      yield_data(Utils.random8Bytes());

      // Test acknowledgement.
      yield_data(callable_struture, (acknowledge_information) => {
        console.log('[Service module] Service function acknowledge_information: ', acknowledge_information);
        yield_data(Buffer.from([1, 2, 3, 4, 5]));
        return_data({bar: 'last round'});
        finish('service_function_test');
      });
    });
  });
  // **** Service Module Test End ****

  console.log('[Activity module] Activity create test.');

  // **** Activity Module Test Start ****
  Activity.createActivity([{
    interface_name: 'WebSocket',
    connector_settings: {
      host: '0.0.0.0',
      port: 12345
    }
  }], 'default', {a: 'parameter a'}, (error, activity_of_service) => {

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
        yield_data({foo: 123}, (acknowledge_information) => {
          console.log('[Activity module] Yield acknowledge_information.', acknowledge_information);
          yield_data(Buffer.from([5, 4, 3, 2, 1]));
          finish_yield('haha');
        });
      });
      activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof, acknowledge)=> {
        if (err) {
          console.log('[Activity module] call test_func error.', err);
        }
        console.log('[Activity module] Return value: ', data);
        if(acknowledge) acknowledge('ack');

        // Twice
        if(data.isCallableStructure) {
          data.call('haha', (...params) => {
            console.log('[NSDT module] haha callback params, ', params);
            finish('nsdt_test');
          });
        }

        if(eof) activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof, acknowledge)=> {
          if(acknowledge) acknowledge('ack');

          console.log('[Activity module] Returned value: ', data);
          if(eof) setTimeout(()=>{activity_of_service.close()}, 1500);
        });
      });
    }
  });
  // **** Activity Module Test End ****
})

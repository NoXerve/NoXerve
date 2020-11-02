/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

 'use strict';

 const fs = require('fs');
const static_global_random_seed_4096bytes = fs.readFileSync('./worker/static_global_random_seed_4096bytes');

console.log('[Tester] Start testing...');

let Tests = [
  'activity_test',
  'service_function_test',
  'service_yield_test',
  'worker_test',
  'worker_func1_call_test',
  'worker_func2_call_test',
  'worker_field2_yield_test',
  'worker_field1_yield_test',
  'nsdt_test'
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

let Utils = require('../utils');
let NoXerveAgent = new(require('../index'))({
  secured_node: true,
  rsa_2048_key_pair: {
    public: fs.readFileSync('./public.pem', 'utf8'),
    private: fs.readFileSync('./private.pem', 'utf8'),
  }
});

NoXerveAgent.Worker.importStaticGlobalRandomSeed(static_global_random_seed_4096bytes, (error) => {
  if (error) console.log('[NoXerveAgent] importStaticGlobalRandomSeed error.', error);
  NoXerveAgent.start((error)=> {
    if (error) console.log('[NoXerveAgent] start error.', error);
    NoXerveAgent.createInterface('WebSocket', {
      host: '0.0.0.0',
      port: 12345
    }, (err, id) => {
      if (err) console.log('[Node2 module] Create interface error.', err);

      // **** Worker Module Test Start ****


      // Only myself one worker. For multiple worker test got worker directory.
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

      NoXerveAgent.Worker.importMyWorkerAuthenticityData(1, 'whatsoever_auth', (error)=> {
        if (error) console.log('[Worker module] importMyWorkerAuthenticityData error.', error);

        NoXerveAgent.Worker.importWorkerPeersSettings(worker_peers_settings, (error)=> {
          if (error) console.log('[Worker module] importWorkerPeersSettings error.', error);
          NoXerveAgent.Worker.on('worker-peer-authentication', (worker_id, worker_authenticity_information, is_valid)=> {
            if(worker_id === 0) {
              // Initailize new worker.
            }
            console.log('[Worker module] "worker-peer-authentication" event. ', worker_id, worker_authenticity_information);
            is_valid(true);
          });

          NoXerveAgent.Worker.onWorkerSocketCreate('purpose 1', (parameters, remote_worker_id, worker_socket)=> {
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
              yield_data({foo: 321}, (acknowledge_message_bytes)=> {
                console.log('[Worker module] "field1" acknowledge_message_bytes.', acknowledge_message_bytes);
                yield_data(Buffer.from([5, 4, 3, 0, 1]));
                finish_yield('hehe');
              });
            });
          });

          NoXerveAgent.Worker.createWorkerSocket('purpose 1', {p: 1}, 1, (error, worker_socket)=> {
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
                yield_data({foo: 123}, (acknowledge_message_bytes)=> {
                  console.log('[Worker module] WorkerSocket function on createWorkerSocket. acknowledge_message_bytes', acknowledge_message_bytes);
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
        });
      });

      // **** Worker Module Test End ****

      // **** Service Module Test Start ****
      NoXerveAgent.Service.onActivityCreate('default', (parameter, service_of_activity) => {
        console.log('[Service module] Activity(default) created. Parameter:', parameter);
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

          const callable_struture = NoXerveAgent.NSDT.createCallableStructure({haha: (callback)=> {
            console.log('[NSDT module] NSDT haha called.');
            const callable_struture_2 = NoXerveAgent.NSDT.createCallableStructure({nah: ()=> {}});
            callback(callable_struture, callable_struture_2, 321);
          }});

          callable_struture.on('close', ()=> {
            console.log('[NSDT module] NSDT haha closed.');
          });

          // service_of_activity.close();
          yield_data({bar: 13579});
          yield_data(Utils.random8Bytes());

          // Test acknowledgment.
          yield_data(callable_struture, (acknowledge_message_bytes) => {
            console.log('[Service module] Service function acknowledge_message_bytes: ', acknowledge_message_bytes);
            yield_data(Buffer.from([1, 2, 3, 4, 5]));
            return_data({bar: 'last round'});
            finish('service_function_test');
          });
        });
      });
      // **** Service Module Test End ****

      console.log('[Activity module] Activity create test.');

      // **** Activity Module Test Start ****
      NoXerveAgent.Activity.createActivity([{
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
            yield_data({foo: 123}, (acknowledge_message_bytes) => {
              console.log('[Activity module] Yield acknowledge_message_bytes.', acknowledge_message_bytes);
              yield_data(Buffer.from([5, 4, 3, 2, 1]));
              finish_yield('haha');
            });
          });
          activity_of_service.call('test_func', {foo: 'call from activity'}, (error, data, eof, acknowledge)=> {
            if (error) console.log('[Activity module] Call error.', error);
            console.log('[Activity module] Return value: ', data);
            if(acknowledge) acknowledge('ack');

            // Twice
            if(data.isCallableStructure) {
              data.call('haha', (...params) => {
                console.log('[NSDT module] haha callback params, ', params);
                finish('nsdt_test');
              });
            }

            // Twice
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
  });
});

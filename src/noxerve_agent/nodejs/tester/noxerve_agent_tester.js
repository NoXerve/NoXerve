/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

console.log('[Tester] Start testing...');

let Tests = [
  'activity_test',
  'service_function_test',
  'service_yield_test',
  'worker_test',
  'worker_func1_call_test',
  'worker_func2_call_test',
  'worker_field2_yield_test',
  'worker_field1_yield_test'
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

let Utils = require('../utils');
let NoXerveAgent = new(require('../index'))({});

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

    NoXerveAgent.Worker.importWorkerAuthenticityData(1, 'whatsoever_auth', (error)=> {
      if (error) console.log('[Worker module] importWorkerAuthenticityData error.', error);

      NoXerveAgent.Worker.importWorkerPeersSettings(worker_peers_settings, (error)=> {
        if (error) console.log('[Worker module] importWorkerPeersSettings error.', error);
        NoXerveAgent.Worker.on('worker-authenticication', (worker_id, worker_authenticity_information)=> {
          if(worker_id === 0) {
            // Initailize new worker.
          }
          console.log('[Worker module] "worker-authenticication" event. ', worker_id, worker_authenticity_information);
          return true;
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
          worker_socket.call('func1', {foo: 'call from onWorkerSocketCreate'}, (err, data, eof)=> {
            console.log('[Worker module] "func1" Return value: ', data);
            if(eof) finish('worker_func1_call_test');
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
            yield_data({foo: 321});
            yield_data(Buffer.from([5, 4, 3, 0, 1]));
            finish_yield('hehe');
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
              yield_data({foo: 123});
              yield_data(Buffer.from([5, 4, 3, 2, 1]));
              return_data('haha');
            });
            worker_socket.call('func2', {foo: 'call from createWorkerSocket'}, (err, data, eof)=> {
              console.log('[Worker module] "func2" Return value: ', data);
              if(eof) finish('worker_func2_call_test');
            });
            worker_socket.handleYielding('field1', (yielding_handler_parameter, ready_yielding) => {
              console.log('[Worker module] "field1" handleYielding started.');
              console.log('[Worker module] Parameters value: ', yielding_handler_parameter);
              ready_yielding('"field1" ok for yielding.', (error, data, eof)=> {
                if(error) console.log('[Worker module] "field1" Yielding error.', error);
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
    NoXerveAgent.Service.on('connect', (service_of_activity) => {
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
    NoXerveAgent.Activity.createActivity([{
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
        activity_of_service.call('test_func', {foo: 'call from activity'}, (error, data, eof)=> {
          if (error) console.log('[Activity module] Call error.', error);
          console.log('[Activity module] Return value: ', data);
          // Twice
          if(eof) activity_of_service.call('test_func', {foo: 'call from activity'}, (err, data, eof)=> {
            console.log('[Activity module] Returned value: ', data);
            if(eof) setTimeout(()=>{activity_of_service.close()}, 1500);
          });
        });
      }
    });
    // **** Activity Module Test End ****
  })
});

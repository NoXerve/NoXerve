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

Worker.on('worker-authenticication', (worker_authenticity_information)=> {
  console.log('worker_authenticity_information', worker_authenticity_information);
  return true;
});
Worker.importWorkerAuthenticityData(1, 'whatsoever_auth', ()=> {
  Worker.on('ready', (non_uniforms) => {
    non_uniforms.FileSystemGroupA.defineConcurrently('read', ()=> {

    });
    non_uniforms.FileSystemGroupA.handleYieldingConcurrently('write', ()=> {

    });
    non_uniforms.FileSystemGroupA.defineConcurrently('delete', ()=> {

    });
  });
  Worker.importNonUniformList([
    'FileSystemGroupA',
    'FileSystemGroupB',
    'FileSystemGroupC',
    'FileSystemGroupD',
    'FileSystemGroupE'],
    ()=> {
      Worker.handleNonUniform('FileSystemGroupA', {
        2: [{
          interface_name: 'websocket',
          interface_connect_settings: {
            host: '0.0.0.0',
            port: 9992
          }
        }, {
          interface_name: 'websocket',
          interface_connect_settings: {
            host: '0.0.0.0',
            port: 6662
          }
        }]
      }, 100, (error)=> {
        if(error)  console.log('[Worker module] Handle non_uniform error.', error);
      });
      Worker.requestNonUniform('FileSystemGroupB', {}, () => {

      });
    }
  );
});

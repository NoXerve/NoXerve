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
  port: 9992
}, (err, id) => {
  if (err) console.log('[Node module] Create interface error.', err);
  Node.createInterface('WebSocket', {
    host: '0.0.0.0',
    port: 6662
  }, (err, id) => {
    if (err) console.log('[Node module] Create interface error.', err);
  })
})

Worker.importWorkerAuthenticityData(2, 'whatsoever_auth', ()=> {
});

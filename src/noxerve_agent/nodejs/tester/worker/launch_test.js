/**
 * @file NoXerveAgent tester file. [launch_test.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

const readline = require("readline");
const child_process = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const workers_paths = ['./worker_1', './worker_2', './worker_3'];

let worker_ready_left = Object.keys(workers_paths).length;

for(const index in workers_paths) {
  let child = child_process.fork(workers_paths[index], {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});

  child.on('message', (msg)=> {
    if(msg === 'ready') {
      console.log('[Test] Worker '+ index +' ready.');
      worker_ready_left--;
      if(worker_ready_left === 0) {
        next = ()=> {
          rl.question('[Test] Input worker index to execute test.', (number)=> {
            child.send('execTest');
            next();
          });
        };
        rl.on('close', ()=> {
          process.exit();
        });
        next();
      }
    }
  });
}

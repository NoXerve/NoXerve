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

const worker_indexs = ['1', '2', '3'];
const test_indexs = {
  1: 'join worker 3',
  2: 'update worker 3',
  3: 'leave worker 3',
  4: 'worker 1 communication with worker 3',
};

let worker_ready_left = Object.keys(worker_indexs).length;

const worker_childs = {};

for(const index in worker_indexs) {
  const worker_index = worker_indexs[index];
  let child = child_process.fork('./worker_' + worker_index, {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
  worker_childs[worker_index] = child;

  child.on('message', (msg)=> {
    if(msg === 'ready') {
      console.log('[Test] Worker '+ worker_index +' ready.');
      worker_ready_left--;
      if(worker_ready_left === 0) {
        next = ()=> {
          rl.question('[Test] Input test index to execute test.\n'+JSON.stringify(test_indexs, null, 2)+'\n>>> ', (number)=> {
            for(const index in worker_indexs) {
              worker_childs[worker_indexs[index]].send(number);
            }
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

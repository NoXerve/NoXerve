/**
 * @file NoXerveAgent tester file. [launch_test.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

'use strict';

const readline = require("readline");
const child_process = require('child_process');
const FS = require('fs');
const Crypto = require('crypto');

// set static_global_random_seed_4096bytes
if(!FS.existsSync('./static_global_random_seed_4096bytes')) {
  FS.writeFileSync('./static_global_random_seed_4096bytes', Crypto.randomBytes(4096));
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const worker_indexs = ['1', '2', '3', '4', '5'];
const test_indexs = {
  1: 'join worker 3',
  2: 'update worker 3',
  3: 'leave worker 3',
  4: 'worker 1 communication with worker 3',
  5: 'create worker group on worker 1, 2',
  6: 'update variable value from worker 2',
  7: 'get variable value from worker 1',
  8: 'update variable value from worker 1',
  9: 'get variable value from worker 2',
  10: 'join worker 4',
  11: 'join worker 5',
  91: 'kill worker 1',
  92: 'kill worker 2',
};

let worker_ready_left = Object.keys(worker_indexs).length;

const worker_childs = {};

for(const index in worker_indexs) {
  const worker_index = worker_indexs[index];
  let child = child_process.fork('./worker_' + worker_index, {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
  worker_childs[worker_index] = child;
  child.on('close', () => {
    worker_childs[worker_index] = false;
  });
  child.on('message', (msg)=> {
    if(msg === 'ready') {
      console.log('[Test] Worker '+ worker_index +' ready.');
      worker_ready_left--;
      if(worker_ready_left === 0) {
        const next = ()=> {
          rl.question('[Test] Input test index to execute test.\n'+JSON.stringify(test_indexs, null, 2)+'\n>>> ', (number)=> {
            for(const index in worker_indexs) {
              if(worker_childs[worker_indexs[index]]) {
                worker_childs[worker_indexs[index]].send(number);
              }
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

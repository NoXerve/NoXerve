/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

let NoXerveAgent = new (require('./index'))({});

NoXerveAgent.createPassiveInterface('WebSocket', {}, (err, id)=> {
  console.log(id);
  NoXerveAgent.destroyPassiveInterface(id, (err)=> {
    console.log(err);
  });
});

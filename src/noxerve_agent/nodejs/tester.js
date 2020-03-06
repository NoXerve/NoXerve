/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

let NoXerveAgent = new (require('./index'))({});

NoXerveAgent.createInterface('WebSocket', {host: '0.0.0.0', port: 1223}, (err, id)=> {
  console.log(err, id);
  NoXerveAgent.destroyInterface(id, (err)=> {
    console.log(123);

    console.log(err);
  });
});

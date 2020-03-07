/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

let NoXerveAgent = new (require('./index'))({});
let Node = new (require('./node'))();

NoXerveAgent.createInterface('WebSocket', {host: '0.0.0.0', port: 1223}, (err, id)=> {
  NoXerveAgent.destroyInterface(id, (err)=> {
  });
});

Node.on('tunnel-create', (tunnel)=> {
  console.log(tunnel.returnValue('from_connector'), tunnel.returnValue('from_interface'));
  tunnel.on('ready', ()=> {
    console.log('ready');
    tunnel.send('sent');
  });
  tunnel.on('data', (data)=> {
    console.log(data);
  });
  tunnel.on('error', (data)=> {
    console.log('error');
  });

})
Node.createInterface('WebSocket', {host: '0.0.0.0', port: 1224}, (err, id)=> {
  if(err) console.log(err);
  Node.createTunnel('WebSocket', {host: '0.0.0.0', port: 1224}, (err)=> {
    if(err) console.log(err);

  })
})

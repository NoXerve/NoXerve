/**
 * @file NoXerveAgent tester file. [tester.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 * @description Start testing by enter command "node tester.js".
 */

console.log('[Tester] Start testing...');

let Tests = [
  'node_connector_send_test',
  'node_interface_send_test'
];

let finish = (test_name) => {
  let index = Tests.indexOf(test_name);
  if (index !== -1) Tests.splice(index, 1);
  if(!Tests.length) {
    console.log('[Tester] Test finished. Executed all tests. Validate your test from printed result.');
    process.exit();
  }
};

let NoXerveAgent = new(require('./index'))({});
let Node = new(require('./node'))();
let Activity = new(require('./activity'))();
let Service = new(require('./service'))();
let Protocol = new(require('./protocol'))({
  modules: {
    activity: Activity,
    service: Service
  },
  node_module: new(require('./node'))()
});
let Utils = require('./utils');

console.log('[Crypto] random8bytes ', Utils.random8bytes());

console.log('[Node module] NoXerveAgent Object: ', NoXerveAgent);
console.log('[Node module] Node Object: ', Node);
console.log('[Node module] Protocol Object: ', Protocol);

// **** Node Module Test Start ****

console.log('[Node module] Preparing test...');

// Test created tunnel either from "createTunnel" function or "create-tunnel" event.
let tunnel_test = (tunnel) => {
  if(tunnel.returnValue('from_connector')) console.log('[Node module] Tunnel created from connector.');
  if(tunnel.returnValue('from_interface')) console.log('[Node module] Tunnel created from interface.');
  tunnel.on('ready', () => {
    if(tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector. Ready.');
      tunnel.send('Sent from connector.', (error)=> {
        console.log('[Node module] "Sent from interface." sent.');
      });
    }
    if(tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface. Ready.');
      tunnel.send('Sent from interface.', (error)=> {
        console.log('[Node module] "Sent from interface." sent.');
      });
    }
  });
  tunnel.on('data', (data) => {
    if(tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector received data: "', data, '"');
      finish('node_interface_send_test');
    }
    if(tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface received data: "', data, '"');
      finish('node_connector_send_test');
    }
  });
  tunnel.on('close', () => {
    if(tunnel.returnValue('from_connector')) {
      console.log('[Node module] Tunnel created from connector closed.');
    }
    if(tunnel.returnValue('from_interface')) {
      console.log('[Node module] Tunnel created from interface closed.');
    }
  });
  tunnel.on('error', (error) => {
    console.log('[Node module] Tunnel error.', error);
  });

};
Node.on('tunnel-create', tunnel_test)
console.log('[Node module] Create interface.');
Node.createInterface('WebSocket', {
  host: '0.0.0.0',
  port: 1234
}, (err, id) => {
  if (err) console.log('[Node module] Create interface error.', err);
  console.log('[Node module] Create tunnel.');
  Node.createTunnel('WebSocket', {
    host: '0.0.0.0',
    port: 1234
  }, (err, tunnel) => {
    if (err) console.log('[Node module] Create tunnel error.', err)
    else {
      tunnel_test(tunnel);
    }
  });

  // **** Node Module Test End ****

  // **** Protocol Module Test ****
  Protocol.start();
  // **** Protocol Module Test End ****


  // **** Service Module Test****
  Service.on('connect', (service_of_activity)=> {
    console.log('[Service module] Activity created.');
  });
  // **** Service Module Test End****

  // **** Activity Module Test ****

  console.log('[Activity module] Activity create test.');
  Activity.createActivity([{
    interface_name: 'WebSocket',
    interface_connect_settings: {
      host: '0.0.0.0',
      port: 1234
    }
  }], (error, activity_of_service)=> {
    if(error) console.log(error);
    else {
      console.log('[Activity module] Activity created.');
    }
  });

  // **** Activity Module Test End****

})

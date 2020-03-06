/**
 * @file NoXerveFramework launch file. [launch.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

const NoXerveAgent = require('./noxerve_agent/node');

let noxerve_agent = new NoXerveAgent({});

noxerve_agent.createPassiveInterface();
console.log(noxerve_agent.Worker);
console.log(noxerve_agent);

noxerve_agent.Worker.addConnections();

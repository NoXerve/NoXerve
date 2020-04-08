/**
 * @file NoXerveServiceSystem launch file. [launch.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

const FS = require('fs');
const Launcher = require('./noxerve_service_system/launcher');
const Path = require("path");
const working_directory = Path.resolve("./");
const noxerve_agent_library_directory = Path.resolve("./noxerve_agent");

const launcher = new Launcher({
  settings: JSON.parse(FS.readFileSync('./settings.json', 'utf8')),
  working_directory: working_directory,
  noxerve_agent_library_directory: noxerve_agent_library_directory
});

launcher.launch();

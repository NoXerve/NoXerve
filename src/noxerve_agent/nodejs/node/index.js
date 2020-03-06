/**
 * @file NoXerveAgent node file. [node.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 /**
  * @module Node
  */

let Errors = require('../errors');

// Initial avaliable interfaces detail.
const AvaliableInterfacesPath = require("path").join(__dirname, "./interfaces");
let AvaliableInterfaces = {};

// Load avaliable interfaces auto-dynamicly.
require("fs").readdirSync(AvaliableInterfacesPath).forEach((file_name)=> {
  let interface_ = require(AvaliableInterfacesPath+"/" + file_name);

  // Mapping interface's name from specified module.
  AvaliableInterfaces[interface_.interface_name] = interface_;

  // Also mapping interface's name from its aliases.
  // The weird name "interface_" is simply caused by javascript's reserved keyword.
  interface_.interface_name_aliases.forEach((alias_interface_name)=> {
    AvaliableInterfaces[alias_interface_name] = interface_;
  });
});

/**
 * @constructor module:Node
 * @param {object} settings
 * @description NoXerve Node Object
 */
function Node(settings) {
  /**
   * @memberof module:Node
   * @type {object}
   * @private
   */
  this._settings = settings;
  /**
   * @memberof module:Node
   * @type {array}
   * @private
   */
  this._active_passive_interfaces = [];
}

/**
 * @callback module:Node~callback_of_create_passive_interface
 * @param {integer} interface_id
 * @param {error} error
/**
 * @memberof module:Node
 * @param {string} interface_name - "websocket", "tcp" or "websocket_secure".
 * @param {object} interface_settings
 * @param {module:Service~callback_of_create_passive_interface} callback
 * @description Service events. Each corresponded with an edvidual activity.
 */
Node.prototype.createPassiveInterface = function(interface_name, interface_settings, callback) {
  // Catch error.
  try {
    // Create a new passive interface instance from avaliable interfaces list.
    let interface_instance = new AvaliableInterfaces[interface_name].Passive(interface_settings);

    // Append interface and fires callback with no error.
    this._active_passive_interfaces.push(interface_instance);
    callback(false, this._active_passive_interfaces.length - 1);
  }
  catch(e) {
    // [Flag] Ucatogorized error.
    callback(true);
  }
}

/**
 * @callback module:Node~callback_of_destroy_passive_interface
 * @param {error} error
/**
 * @memberof module:Node
 * @param {string} interface_id - Which you've obtained from "createPassiveInterface".
 * @param {module:Service~callback_of_destroy_passive_interface} callback
 * @description Service events. Each corresponded with an edvidual activity.
 */
Node.prototype.destroyPassiveInterface = function(interface_id, callback) {
  // Catch error.
  try {
    // Gracefully destroy interface.
    this._active_passive_interfaces[interface_id].destroy((error)=> {
      if(error) {
        callback(error);
      }
      else {
        // Set this interface slot null. Cancel referation for garbage collection.
        this._active_passive_interfaces[interface_id] = null;
        callback(error);
      }
    });
  }
  catch(error) {
    callback(error);
  }
}

module.exports = Node;

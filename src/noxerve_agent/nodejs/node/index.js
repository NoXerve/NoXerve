/**
 * @file NoXerveAgent node file. [node.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 /**
  * @module Node
  */

const UUID = require('uuid');
const Errors = require('../errors');

// Initial avaliable interfaces detail.
const AvaliableInterfacesPath = require("path").join(__dirname, "./interfaces");
let AvaliableInterfaces = {};

// Load avaliable interfaces auto-dynamicly.
require("fs").readdirSync(AvaliableInterfacesPath).forEach((file_name)=> {
  let interface_ = require(AvaliableInterfacesPath+"/" + file_name);

  // Mapping interface's name from specified module.
  AvaliableInterfaces[interface_.interface_name] = interface_;

  // Also mapping interface's name from its aliases.
  // The weird name "interface_" is simply caused by javascript's reserved
  // keyword.
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
  this._active_interfaces = [];
  /**
   * @memberof module:Node
   * @type {object}
   * @private
   * @description Dictionary with uuid key.
   */
  this._tunnels = {};
}

/**
 * @callback module:Node~callback_of_check_interface_exists
 * @param {error} error
/**
 * @memberof module:Node
 * @param {string} interface_id
 * @param {module:Node~callback_of_check_interface_exists} callback
 * @description Check interface exist or not. If exists then return
 * nothing.
 * @private
 */
Node.prototype._checkInterfaceExists = function(interface_id, callback) {
  if(this._active_interfaces[interface_id]) {
    callback(false);
  }
  else {
    callback(new Errors.ERR_NOXERVEAGENT_NODE_INTERFACE_NOT_EXISTS('The interface with interface id "'+interface_id+'" does not exist.'));
  }
}

/**
 * @callback module:Node~callback_of_create_interface
 * @param {integer} interface_id
 * @param {error} error
/**
 * @memberof module:Node
 * @param {string} interface_name - "websocket", "tcp" or "websocket_secure".
 * @param {object} interface_settings
 * @param {module:Node~callback_of_create_interface} callback
 * @description Service events. Each corresponded with an edvidual activity.
 */
Node.prototype.createInterface = function(interface_name, interface_settings, callback) {
  // Catch error.
  try {
    // Check interface settings match the requirement of interface module.
    let pass = true;
    let interface_settings_keys = Object.keys(interface_settings);
    let interface_required_settings = AvaliableInterfaces[interface_name].interface_required_settings;
    Object.keys(interface_required_settings).forEach((setting_name)=> {
      if(!interface_settings_keys.includes(setting_name)) {
        throw new Errors.ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE('Missing settings argument "'+setting_name+'". '+interface_required_settings[setting_name]);
      }
    });

    // Create a new interface instance from avaliable interfaces list.
    let interface_instance = new AvaliableInterfaces[interface_name].Interface(interface_settings);

    // Start interface
    interface_instance.start((error)=> {
      if(error) {
        callback(error);
      }
      else {
        // Append interface and fires callback with no error.
        this._active_interfaces.push(interface_instance);
        callback(false, this._active_interfaces.length - 1);
      }
    });
  }
  catch(error) {
    callback(error);
  }
}

/**
 * @callback module:Node~callback_of_destroy_interface
 * @param {error} error
/**
 * @memberof module:Node
 * @param {string} interface_id - Which you've obtained from "createInterface".
 * @param {module:Node~callback_of_destroy_interface} callback
 * @description Service events. Each corresponded with an edvidual activity.
 */
Node.prototype.destroyInterface = function(interface_id, callback) {
  // Catch error.
  try {
    this._checkInterfaceExists(interface_id, (error)=> {
      if(error) {
        callback(error);
      }
      else {
        // Gracefully destroy interface.
        this._active_interfaces[interface_id].destroy((error)=> {
          if(error) {
            callback(error);
          }
          else {
            // Set this interface slot null. Cancel referation for garbage collection.
            this._active_interfaces[interface_id] = null;
            callback(error);
          }
        });
      }
    });
  }
  catch(error) {
    callback(error);
  }
}

/**
 * @callback module:Node~callback_of_close
 * @param {error} error
/**
 * @memberof module:Node
 * @param {module:Node~callback_of_close} callback
 * @description Service events. Each corresponded with an edvidual activity.
 */
Node.prototype.close = function(interface_id, callback) {
  // Catch error.
  try {
  }
  catch(error) {
  }
}
module.exports = Node;

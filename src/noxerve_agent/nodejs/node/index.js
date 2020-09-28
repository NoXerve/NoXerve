/**
 * @file NoXerveAgent node file. [node.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Node
 * @namespace Node
 */

const UUID = require('uuid');
const Errors = require('../errors');
const Tunnel = require('./tunnel');


// Initial avaliable interfaces detail.
const AvaliableInterfacesPath = require("path").join(__dirname, "./interfaces");
let AvaliableInterfaces = {};

// Load avaliable interfaces auto-dynamicly.
require("fs").readdirSync(AvaliableInterfacesPath).forEach((file_name) => {
  let interface_ = require(AvaliableInterfacesPath + "/" + file_name);

  // Mapping interface's name from specified module.
  AvaliableInterfaces[interface_.interface_name] = interface_;

  // Also mapping interface's name from its aliases.
  // The weird name "interface_" is simply caused by javascript's reserved
  // keyword.
  if (interface_.interface_name_aliases) interface_.interface_name_aliases.forEach((alias_interface_name) => {
    AvaliableInterfaces[alias_interface_name] = interface_;
  });
});

/**
 * @constructor module:Node
 * @param {object} settings
 * @description NoXerve Agent Node Object. Module that abstractly provide node object of a network.
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
   * @description Connector dictionarys.
   */
  this._active_interface_connectors = {};

  /**
   * @memberof module:Node
   * @type {object}
   * @private
   * @description Dictionary of event listeners.
   */
  this._event_listeners = {
    'tunnel-create': (tunnel) => {

    },

    'error': () => {

    }
  };
}

/**
 * @callback module:Node~callback_of_new_tunnel
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {module:Node~callback_of_new_tunnel} callback
 * @description Check interface exist or not. If exists then return
 * nothing.
 * @private
 */
Node.prototype._newTunnel = function(interface_name, from_interface, from_connector, send, close, callback) {
  let called_callback = false;
  // Catch error.
  try {
    // Create a new tunnel object with proper setting.
    let tunnel = new Tunnel({
      close: close,
      send: send
    });

    tunnel.setValue('interface_name', interface_name);
    tunnel.setValue('interface_secured', AvaliableInterfaces[interface_name].secured);
    tunnel.setValue('from_interface', from_interface);
    tunnel.setValue('from_connector', from_connector);

    callback(false, tunnel);
  } catch (error) {
    // console.log(called_callback, error);
    if (!called_callback) callback(error);
    else {
      throw error;
    }
  }
}

/**
 * @callback module:Node~callback_of_check_interface_exists
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {string} interface_name
 * @param {module:Node~callback_of_check_interface_exists} callback
 * @description Check interface exist or not. If exists then return
 * nothing.
 * @private
 */
Node.prototype._checkInterfaceExists = function(interface_name, callback) {
  if (this._active_interfaces[interface_name]) {
    callback(false);
  } else {
    callback(new Errors.ERR_NOXERVEAGENT_NODE_INTERFACE_NOT_EXISTS('The interface with interface id "' + interface_id + '" does not exist.'));
  }
}

/**
 * @callback module:Node~callback_of_check_connector_avaliable
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {string} interface_name
 * @param {module:Node~callback_of_check_connector_avaliable} callback
 * @description Check connector exist or not. If exists then return
 * nothing.
 */
Node.prototype._checkConnectorAvaliable = function(interface_name, callback) {
  if (this._active_interface_connectors[interface_name]) {
    callback(false);
  } else if (AvaliableInterfaces[interface_name]) {
    // Create connector instance of the interface.
    let connector = new AvaliableInterfaces[interface_name].Connector({});
    this._active_interface_connectors[interface_name] = connector;

    // Also mapping interface's name from its aliases.
    AvaliableInterfaces[interface_name].interface_name_aliases.forEach((alias_interface_name) => {
      this._active_interface_connectors[alias_interface_name] = connector;
    });
    callback(false);
  } else {
    callback(new Errors.ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE('The connector of interface "' + interface_name + '" does not avaliable on this platfrom.'));
  }
}

/**
 * @memberof module:Node
 * @param {string} interface_name
 * @return {boolean} is_interface_secured
 */
Node.prototype.isInterfaceSecured = function(interface_name) {
  return AvaliableInterfaces[interface_name].secured;
}

/**
 * @callback module:Node~callback_of_create_interface
 * @param {integer} interface_id
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {string} interface_name - "websocket", "tcp" or "websocket_secure".
 * @param {object} interface_settings
 * @param {module:Node~callback_of_create_interface} callback
 * @description Create interface via avaliable interfaces.
 */
Node.prototype.createInterface = function(interface_name, interface_settings, callback) {
  let called_callback = false;
  // Catch error.
  try {
    // Check interface settings match the requirement of interface module.
    let pass = true;
    let interface_settings_keys = Object.keys(interface_settings);
    let interface_required_settings = AvaliableInterfaces[interface_name].interface_required_settings;
    Object.keys(interface_required_settings).forEach((setting_name) => {
      if (!interface_settings_keys.includes(setting_name)) {
        throw new Errors.ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE('Missing settings argument "' + setting_name + '". ' + interface_required_settings[setting_name]);
      }
    });

    // Create a new interface instance from avaliable interfaces list.
    let interface_instance = new AvaliableInterfaces[interface_name].Interface(interface_settings, (send, close, emitter_initializer_from_interface) => {
      // Fill in proper interface information for interface itself.
      // AvaliableInterfaces[interface_name].interface_name provide a "standard"
      // interface name.
      try {
        this._newTunnel(AvaliableInterfaces[interface_name].interface_name, true, false, send, close, (error, tunnel) => {
          if(error) {
            emitter_initializer_from_interface(error);
          }
          else {
            // Get tunnel emitter and pass to interface or connector.
            tunnel.getEmitter((error, emitter) => {
              this._event_listeners['tunnel-create'](tunnel);
              emitter_initializer_from_interface(error, emitter);
            });
          }
        });
      } catch (error) {
        console.log(error);
        this._event_listeners['interface-error'](error);
      }
    });

    // Start interface
    interface_instance.start((error) => {
      if (error) {
        called_callback = true;
        callback(error);
      } else {
        // Append interface and fires callback with no error.
        this._active_interfaces.push(interface_instance);
        called_callback = true;
        callback(false, this._active_interfaces.length - 1);
      }
    });
  } catch (error) {
    if (called_callback) throw error;
    else callback(error);
  }
}

/**
 * @callback module:Node~callback_of_destroy_interface
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {string} interface_id - Which you've obtained from "createInterface".
 * @param {module:Node~callback_of_destroy_interface} callback
 * @description Destroy exists interface.
 */
Node.prototype.destroyInterface = function(interface_id, callback) {
  let called_callback = false;
  // Catch error.
  try {
    this._checkInterfaceExists(interface_id, (error) => {
      if (error) {
        called_callback = true;
        callback(error);
      } else {
        // Gracefully destroy interface.
        this._active_interfaces[interface_id].destroy((error) => {
          if (error) {
            called_callback = true;
            callback(error);
          } else {
            // Set this interface slot null. Cancel referation for garbage collection.
            this._active_interfaces[interface_id] = null;
            called_callback = true;
            callback(error);
          }
        });
      }
    });
  } catch (error) {
    if (called_callback) throw error;
    else callback(error);
  }
}

/**
 * @callback module:Node~callback_of_create_tunnel
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {string} interface_name,
 * @param {object} connector_settings,
 * @param {module:Node~callback_of_create_tunnel} callback
 * @description Create tunnel via available interfaces.
 */
Node.prototype.createTunnel = function(interface_name, connector_settings, callback) {
  let called_callback = false;
  // Catch error.
  try {
    this._checkConnectorAvaliable(interface_name, (error) => {
      // Check connector settings match the requirement of interface module.
      let pass = true;
      let connector_settings_keys = Object.keys(connector_settings);
      let interface_connector_required_settings = AvaliableInterfaces[interface_name].connector_required_settings;
      Object.keys(interface_connector_required_settings).forEach((setting_name) => {
        if (!connector_settings_keys.includes(setting_name)) {
          throw new Errors.ERR_NOXERVEAGENT_NODE_CONNECTOR_CREATE('Missing settings argument "' + setting_name + '". ' + interface_connector_required_settings[setting_name]);
        }
      });

      this._active_interface_connectors[interface_name].connect(connector_settings,
        // Note that this function behave just like this._newTunnel function but with the "connector" taste.
        // instead of interface.
        (send, close, emitter_initializer_from_connector) => {
          // Create a new tunnel object with proper setting.
          this._newTunnel(AvaliableInterfaces[interface_name].interface_name, false, true, send, close, (error, tunnel) => {
            if(error) {
              callback(error);
              emitter_initializer_from_connector(error);
            }
            else {
              // Get tunnel emitter and pass to interface or connector.
              tunnel.getEmitter((error, emitter) => {
                callback(error, tunnel);
                emitter_initializer_from_connector(error, emitter);
              });
            }
          });
        });
    });
  } catch (error) {
    if (called_callback) throw error;
    else callback(error);
  }
}

/**
 * @callback module:Node~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:Node
 * @param {string} event_name
 * @param {module:Node~callback_of_on} callback
 * @description Register event listener.
 */
Node.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @callback module:Node~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {module:Node~callback_of_start} callback
 * @description Start running node.
 */
Node.prototype.start = function(callback) {
  if (callback) callback(false);
}

/**
 * @callback module:Node~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Node
 * @param {module:Node~callback_of_close} callback
 * @description Close module.
 */
Node.prototype.close = function(interface_id, callback) {
  if (callback) callback(false);
}
module.exports = Node;

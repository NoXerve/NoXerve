/**
 * @file NoXerveAgent protocol index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Protocol
 */

const Errors = require('../errors');
const HashManager = require('./hash_manager');

// Initial supported protocols detail.
const SupportedProtocolsPath = require("path").join(__dirname, "./protocols");
const SupportedEmbeddedProtocolsPath = require("path").join(__dirname, "./embedded_protocols");

let SupportedProtocols = {};
let SupportedEmbeddedProtocols = {};

// Load avaliable protocols auto-dynamicly.
require("fs").readdirSync(SupportedProtocolsPath).forEach((file_name) => {
  let protocol = require(SupportedProtocolsPath + "/" + file_name);

  // Mapping protocol's name from specified module.
  SupportedProtocols[protocol.protocol_name] = protocol;
});

// Load avaliable protocols auto-dynamicly.
require("fs").readdirSync(SupportedEmbeddedProtocolsPath).forEach((file_name) => {
  let protocol = require(SupportedEmbeddedProtocolsPath + "/" + file_name);

  // Mapping protocol's name from specified module.
  SupportedEmbeddedProtocols[protocol.protocol_name] = protocol;
});


/**
 * @constructor module:Protocol
 * @param {object} settings
 * @description NoXerve Agent Protocol Object. Protocols module focus only on format.
 * Please do not put too much logic in protocols..
 */

function Protocol(settings) {
  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._imported_modules = settings.modules;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._node_module = settings.node_module;

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._hash_manager = new HashManager();

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._protocol_modules = {};

  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._embedded_protocol_modules = {};

  // Initailize embedded protocols.
  for (const protocol_name in SupportedEmbeddedProtocols) {
    // Fetch protocol.
    const Protocol = SupportedEmbeddedProtocols[protocol_name];
    // console.log(SupportedEmbeddedProtocols, this._imported_modules, this._imported_modules[Protocol.related_module_name]);

    // Check it's related module exists.
    if (this._imported_modules[Protocol.related_module_name]) {

      this._embedded_protocol_modules[Protocol.protocol_name] = new(Protocol.module)({
        related_module: this._imported_modules[Protocol.related_module_name],
        hash_manager: this._hash_manager
      });
    }
  }

  // Initailize protocols.
  for (const protocol_name in SupportedProtocols) {
    // Fetch protocol.
    let Protocol = SupportedProtocols[protocol_name];

    // Check it's related module exists.
    if (this._imported_modules[Protocol.related_module_name]) {

      this._protocol_modules[Protocol.protocol_name] = new(Protocol.module)({
        related_module: this._imported_modules[Protocol.related_module_name],
        synchronize: this._synchronize.bind(this),
        hash_manager: this._hash_manager,
        embedded_protocols: this._embedded_protocol_modules
      });
    }
  }
}

/**
 * Handshake routine:
 * synchronize(initiative side)
 * => synchronize_listener(passive side)
 * => synchronize_acknowledgment(passive side)
 * => synchronize_acknowledgment_handler(initiative side finished pass the tunnel)
 * => acknowledge(initiative side)
 * => acknowledge_handler(passive side finished pass the tunnel)
 */

 /**
  * @memberof module:Protocol
  * @type {object}
  * @private
  */
Protocol.prototype._synchronize = function (interface_name, connector_settings, synchronize_message_bytes, synchronize_error_handler, synchronize_acknowledgment_handler) {
  this._node_module.createTunnel(interface_name, connector_settings, (error, tunnel) => {
    if (error) {if(synchronize_acknowledgment_handler) synchronize_error_handler(error);}
    else {
      let synchronize_message_bytes_sent = false;
      let acknowledged = false;
      let acknowledge_callback_outside = () => {};

      tunnel.on('ready', () => {
        // Send synchronize_message_bytes as tunnel is ready.
        tunnel.send(synchronize_message_bytes, (error) => {
          if(error) {
            synchronize_error_handler(error);
            synchronize_error_handler = () => {};
            tunnel.close();
          }
          else {
            synchronize_message_bytes_sent = true;
          }
        });
      });

      tunnel.on('data', (data) => {
        if(synchronize_message_bytes_sent) {
          const synchronize_acknowledgment_message_bytes = data;

          const acknowledge = (acknowledge_message_bytes, acknowledge_callback) => {
            acknowledged = true;
            if (acknowledge_message_bytes === false) {
              tunnel.close();
            }
            else {
              try {
                acknowledge_callback_outside = acknowledge_callback;
                tunnel.send(acknowledge_message_bytes, (error) => {
                  if (error) {
                    tunnel.close();
                    acknowledge_callback(error, null);
                  } else {
                    // Reset events.
                    tunnel.on('ready', () => {});
                    tunnel.on('data', () => {});
                    tunnel.on('error', () => {});

                    // Finish up
                    acknowledge_callback(error, tunnel);
                  }
                });
              } catch (error) {
                tunnel.close();
                acknowledge_callback(error, null);
              }
            }
          }

          // Call synchronize_acknowledgment_handler function. Respond with acknowledge_message_bytes for remote.
          synchronize_acknowledgment_handler(synchronize_acknowledgment_message_bytes, acknowledge);
        }
        else {
          synchronize_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL('Remote sent data before synchronized.'));
          synchronize_error_handler = () => {};
          tunnel.close();
        }
      });

      tunnel.on('error', (error) => {
        if(acknowledged) {
          acknowledge_callback_outside(error);
          acknowledge_callback_outside = () => {};
          tunnel.close();
        }
        else {
          synchronize_error_handler(error);
          synchronize_error_handler = () => {};
          tunnel.close();
        }
      });

      tunnel.on('close', () => {
        if(!acknowledged) {
          synchronize_error_handler(new Errors.ERR_NOXERVEAGENT_PROTOCOL('Tunnel closed before handshake finished.'));
        }
      });
    }
  });
}

/**
 * @callback module:Protocol~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:Protocol
 * @param {module:Protocol~callback_of_start} callback
 */
Protocol.prototype.start = function(callback) {
  const module_name_list = Object.keys(this._protocol_modules);
  let index = 0;

  const loop = () => {
    const module_name = module_name_list[index];
    this._protocol_modules[module_name].start((error) => {
      if(error) {
        if(callback) callback(error);
      }
      else {
        loop_next();
      }
    });
  };

  const loop_next = () => {
    index++;
    if(index < module_name_list.length) {
      loop();
    }
    else {
      // Handle tunnel create event from node module.
      // Specifically speaking, use handshake to identify which module does tunnel belong to.
      this._node_module.on('tunnel-create', (tunnel) => {
        // Check is passive. Since following patterns are designed only for the role of passive.
        if (tunnel.returnValue('from_connector')) {
          tunnel.close()
        } else {

          // Use stage variable to identify current handshake progress.
          // Avoiding proccess executed wrongly.
          // stage -1 => Emitted error.
          // Tunnel created => stage 0
          // stage 0 => waiting to synchronize.
          // Error => call nothing.
          // stage 1 => waiting to acknowledge.
          // Error => call synchronize_acknowledgment_error_handler.
          let stage = 0;

          let ready_state = false;
          let related_module = null;

          let synchronize_acknowledgment_error_handler_outside;
          let acknowledge_handler_outside;

          tunnel.on('ready', () => {
            ready_state = true;
          });
          tunnel.on('data', (data) => {
            if (stage === 0) {
              const synchronize_message_bytes = data;
              let has_any_synchronize_acknowledgment_message_bytes = false;
              let synchronize_protocol_left_count = Object.keys(this._protocol_modules).length;

              // Check if any protocol module synchronize with the data or not.
              for (const protocol_name in this._protocol_modules) {
                const synchronize_acknowledgment = (synchronize_acknowledgment_message_bytes, synchronize_acknowledgment_error_handler, acknowledge_handler) => {
                  synchronize_protocol_left_count--;

                  // If responded then finish up.
                  if(has_any_synchronize_acknowledgment_message_bytes) {
                    return;
                  }
                  else if (synchronize_acknowledgment_message_bytes !== false && synchronize_acknowledgment_message_bytes !== null) {
                    has_any_synchronize_acknowledgment_message_bytes = true;
                    synchronize_acknowledgment_error_handler_outside = synchronize_acknowledgment_error_handler;
                    acknowledge_handler_outside = acknowledge_handler;
                    // Associate protocol module and send data to remote.
                    related_module = this._protocol_modules[protocol_name];

                    stage = 1;

                    // Send synchronize() return value to remote.
                    try {
                      tunnel.send(synchronize_acknowledgment_message_bytes, (error) => {
                        if (error) {
                          stage = -1;
                          tunnel.close();
                          if(synchronize_acknowledgment_error_handler) synchronize_acknowledgment_error_handler(error);
                        }
                      });
                    } catch (error) {
                      stage = -1;
                      tunnel.close();
                      if(synchronize_acknowledgment_error_handler) synchronize_acknowledgment_error_handler(error);
                    }
                  } else if(synchronize_protocol_left_count === 0) {
                    // Reset handlers.
                    synchronize_acknowledgment_error_handler = null;
                    acknowledge_handler_outside = null;
                    tunnel.close();
                  }
                }

                // Call synchronize function. Check will it respond with data or not.
                this._protocol_modules[protocol_name].SynchronizeListener(synchronize_message_bytes, synchronize_acknowledgment);
              }

              // // If no protocol module synchronize with the data. Close tunnel.
              // if (related_module === null) {
              //   tunnel.close()
              // }
            } else if (stage === 1) {
              const acknowledge_message_bytes = data;
              // Reset events.
              tunnel.on('ready', () => {});
              tunnel.on('data', () => {});
              tunnel.on('error', () => {});

              // Finished handshake. Transfer tunnel ownership.
              acknowledge_handler_outside(acknowledge_message_bytes, tunnel);
            }
          });

          tunnel.on('error', (error) => {
            if (ready_state) {
              if (stage === 0) {
                // Happened error even not synchronize at all. Abort operation without any further actions.
                stage = -1;
                tunnel.close();
              } else if (stage === 1) {
                stage = -1;
                tunnel.close();
                if(synchronize_acknowledgment_error_handler_outside) synchronize_acknowledgment_error_handler_outside(error);
              }
            } else {
              // Happened error even not ready at all. Abort operation without any further actions.
              stage = -1;
              tunnel.close();
            }
          });

          tunnel.on('close', () => {
            if (stage === 1) {
              if(synchronize_acknowledgment_error_handler_outside) synchronize_acknowledgment_error_handler_outside(new Errors.ERR_NOXERVEAGENT_PROTOCOL('Tunnel closed before handshake finished.'));
            }
          });
        }
      });

      if(callback) callback(false);
    }
  };

  // Start loop through protocols.
  loop();
}

/**
 * @callback module:Protocol~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:Protocol
 * @param {module:Protocol~callback_of_close} callback
 */
Protocol.prototype.close = function(callback) {
  const protocol_modules_counts = Object.keys(this._protocol_modules).length;
  const decorated_callback = () => {

  };
  // Check if any protocol module synchronize with the data or not.
  for (const protocol_name in this._protocol_modules) {
    this._protocol_modules[protocol_name].close(decorated_callback);
  }
}

module.exports = Protocol;

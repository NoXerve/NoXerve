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
let SupportedProtocols = {};

// Load avaliable protocols auto-dynamicly.
require("fs").readdirSync(SupportedProtocolsPath).forEach((file_name) => {
  let protocol = require(SupportedProtocolsPath + "/" + file_name);

  // Mapping protocol's name from specified module.
  SupportedProtocols[protocol.protocol_name] = protocol;
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
   * Handshake routine:
   * open_handshake(initiative)
   * => synchronize(passive)
   * => acknowledge_synchronization(initiative finished)
   * => acknowledge(passive finished)
   */

   /**
    * @memberof module:Protocol
    * @type {object}
    * @private
    */
  this._openHandshake = (interface_name, interface_connect_settings, synchronize_information, acknowledge_synchronization, finish_handshake) => {
    this._node_module.createTunnel(interface_name, interface_connect_settings, (error, tunnel) => {
      if (error) {if(acknowledge_synchronization) acknowledge_synchronization(error);}
      else {
        // Use stage variable to identify current handshake progress.
        // Avoiding proccess executed wrongly.
        // stage -1 => Emitted error.
        // Be called => stage 0
        // stage 0 => waiting to acknowledge synchronization.
        // Error => call acknowledge_synchronization.
        // stage 1 => waiting to finish up.
        // Error => call finish_handshake.
        let stage = 0;

        let ready_state = false;

        tunnel.on('ready', () => {
          ready_state = true;
          // Send synchronize_information as tunnel is ready.
          tunnel.send(synchronize_information);
        });

        tunnel.on('data', (data) => {
          if (stage === 0) {
            // Call acknowledge_synchronization function. Respond with acknowledge_information for remote.
            acknowledge_synchronization(false, data, (acknowledge_information)=> {
              // stage 1 => waiting to finish up. If any error happened call
              // "finish_handshake" from arguments.
              stage = 1;
              try {
                if (acknowledge_information === false) {
                  // [Flag] Uncatogorized error.
                  stage = -1;
                  tunnel.close();
                }
                else {
                  tunnel.send(acknowledge_information, (error) => {
                    if (error) {
                      stage = -1;
                      tunnel.close();
                      finish_handshake(error);
                    } else {
                      // Reset events.
                      tunnel.on('ready', () => {});
                      tunnel.on('data', () => {});
                      tunnel.on('error', () => {});

                      // Finish up
                      finish_handshake(error, tunnel);
                    }
                  });
                }
              } catch (error) {
                stage = -1;
                tunnel.close();
                finish_handshake(error);
              }
            });
          } else if (stage === 1) {
            // Nothing happened
          }
        });

        tunnel.on('error', (error) => {
          if (stage === 0) {
            // [Flag] Uncatogorized error.
            stage = -1;
            tunnel.close();
            acknowledge_synchronization(error, null, ()=> {});
          } else if (stage === 1) {
            // [Flag] Uncatogorized error.
            stage = -1;
            tunnel.close();
            finish_handshake(error);
          }
        });

        tunnel.on('close', () => {
          if (stage === 0) {
            // [Flag] Uncatogorized error.
            acknowledge_synchronization('Tunnel closed.', null, ()=> {});
          } else if (stage === 1) {
            // [Flag] Uncatogorized error.
            finish_handshake(true);
          }
        });
      }
    });
  }


  /**
   * @memberof module:Protocol
   * @type {object}
   * @private
   */
  this._protocol_modules = {};

  // Initailize this._protocols.
  for (const protocol_name in SupportedProtocols) {
    // Fetch protocol.
    let Protocol = SupportedProtocols[protocol_name];

    // Check it's related module exists.
    if (this._imported_modules[Protocol.related_module_name]) {

      this._protocol_modules[Protocol.protocol_name] = new(Protocol.module)({
        related_module: this._imported_modules[Protocol.related_module_name],
        open_handshake: this._openHandshake,
        hash_manager: this._hash_manager
      });
    }
  }
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
    console.log(module_name, this._protocol_modules[module_name]);
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
      // Specificlly speaking, use handshake to identify which module does tunnel belong to.
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
          // Error => call synchronization_error_handler.
          let stage = 0;

          let ready_state = false;
          let related_module = null;

          let synchronization_error_handler;
          let acknowledge_handler;

          const onSynchronizationError = (callback) => {
            synchronization_error_handler = callback;
          };
          const onAcknowledge = (callback) => {
            acknowledge_handler = callback;
          };

          tunnel.on('ready', () => {
            ready_state = true;
          });
          tunnel.on('data', (data) => {
            if (stage === 0) {
              let has_any_synchronize_returned_data = false;
              let synchronize_protocol_left_count = Object.keys(this._protocol_modules).length;

              // Check if any protocol module synchronize with the data or not.
              for (const protocol_name in this._protocol_modules) {
                // Call synchronize function. Check will it respond with data or not.
                this._protocol_modules[protocol_name].synchronize(data, onSynchronizationError, onAcknowledge, (synchronize_returned_data)=> {
                  synchronize_protocol_left_count--;
                  // If responded then finish up.
                  if(has_any_synchronize_returned_data) {
                    return;
                  }
                  else if (synchronize_returned_data !== false && synchronize_returned_data !== null) {
                    has_any_synchronize_returned_data = true;
                    // Associate protocol module and send data to remote.
                    related_module = this._protocol_modules[protocol_name];

                    stage = 1;

                    // Send synchronize() return value to remote.
                    try {
                      tunnel.send(synchronize_returned_data, (error) => {
                        if (error) {
                          stage = -1;
                          tunnel.close();
                          synchronization_error_handler(error, data);
                        }
                      });
                    } catch (error) {
                      stage = -1;
                      tunnel.close();
                      synchronization_error_handler(error, data);
                    }
                  } else if(synchronize_protocol_left_count === 0) {
                    // Reset handlers.
                    synchronization_error_handler = null;
                    acknowledge_handler = null;
                    tunnel.close();
                  }
                });
              }

              // If no protocol module synchronize with the data. Close tunnel.
              if (related_module === null) {
                tunnel.close()
              }
            } else if (stage === 1) {
              // Reset events.
              tunnel.on('ready', () => {});
              tunnel.on('data', () => {});
              tunnel.on('error', () => {});

              // Finished handshake. Transfer tunnel ownership.
              acknowledge_handler(data, tunnel);
            }
          });

          tunnel.on('error', (error) => {
            if (ready_state) {
              if (stage === 0) {
                // Happened error even not synchronize at all. Abort opreation without any further actions.
                stage = -1;
                tunnel.close();
              } else if (stage === 1) {
                stage = -1;
                tunnel.close();
                synchronization_error_handler(error);
              }
            } else {
              // Happened error even not ready at all. Abort opreation without any further actions.
              stage = -1;
              tunnel.close();
            }
          });

          tunnel.on('close', () => {
            if (stage === 1) {
              // [Flag] Uncatogorized error.
              synchronization_error_handler('Tunnel close');
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
Protocol.prototype.close = function() {

}

module.exports = Protocol;

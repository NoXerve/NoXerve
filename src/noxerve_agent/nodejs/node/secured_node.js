/**
 * @file NoXerveAgent secured node file. [secured_node.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module SecuredNode
 */

const Node = require('./index');
const Crypto = require('crypto');
const RandomBytesBytesCount = 16;
const Tunnel = require('./tunnel');
const Buf = require('../buffer');

/**
 * @constructor module:SecuredNode
 * @param {object} settings
 * @description NoXerve Agent SecuredNode Object. Module that wrap node module and provide secured connection.
 */
function SecuredNode(settings) {
  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._node_module = new Node(settings);

  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._secured_node_protocol_code = Buf.from([0xff]);

  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._secured_node_comfirm_protocol_code = Buf.from([0xfe]);

  /**
   * @memberof module:SecuredNode
   * @type {object}
   * @private
   */
  this._rsa_2048_key_pair = settings.rsa_2048_key_pair;

  /**
   * @memberof module:SecuredNode
   * @type {function}
   * @private
   */
  this._aes_cbc_256_shared_key_derivation_function = (rsa_2048_public_key_utf8_encoded, random_bytes) => {
    return Crypto.createHash('sha256').update(Buf.concat([rsa_2048_public_key_utf8_encoded, random_bytes])).digest();
  };

  /**
   * @memberof module:SecuredNode
   * @type {function}
   * @private
   */
  this._aes_cbc_256_encrypt_function = (aes_cbc_256_shared_key, data) => {
    const salt = Crypto.randomBytes(8);
    const to_be_encrypted = Buf.concat([
      salt,
      data
    ]);

    // aes_cbc_256_shared_key
    // =>
    // aes_cbc_256_shared_key_first_half_16bytes aes_cbc_256_shared_key_second_half_16bytes

    // Seperate key into two parts for checksum and later aes key.
    const aes_cbc_256_shared_key_first_half_16bytes = aes_cbc_256_shared_key.slice(0, 16);
    const aes_cbc_256_shared_key_second_half_16bytes = aes_cbc_256_shared_key.slice(16);

    // Checksum and kdf.

    // aes_cbc_256_shared_key_second_half_16bytes + to_be_encrypted
    // =>
    // aes_cbc_256_shared_key_second_half_16bytes_and_to_be_encrypted_sha256
    const aes_cbc_256_shared_key_second_half_16bytes_and_to_be_encrypted_sha256 = Crypto.createHash('sha256').update(Buf.concat([aes_cbc_256_shared_key_second_half_16bytes, to_be_encrypted])).digest();

    // aes kdf
    // aes_cbc_256_shared_key_first_half_16bytes + aes_cbc_256_shared_key_second_half_16bytes_and_to_be_encrypted_sha256_first_half
    // =>
    // sha256_for_aes256
    const sha256_for_aes256 = Crypto.createHash('sha256').update(Buf.concat([aes_cbc_256_shared_key_first_half_16bytes, aes_cbc_256_shared_key_second_half_16bytes_and_to_be_encrypted_sha256])).digest();

    // AES 256 cbc mode settings.
    // key: sha256_for_aes256,
    // iv: sha256_for_aes256,
    // checksum: aes_cbc_256_shared_key_second_half_16bytes_and_to_be_encrypted_sha256
    const cipher = Crypto.createCipheriv('aes-256-cbc', sha256_for_aes256, sha256_for_aes256.slice(0, 16));

    return Buf.concat([
      aes_cbc_256_shared_key_second_half_16bytes_and_to_be_encrypted_sha256,
      cipher.update(to_be_encrypted),
      cipher.final()
    ]);
  };

  /**
   * @memberof module:SecuredNode
   * @type {function}
   * @private
   */
  this._aes_cbc_256_decrypt_function = (aes_cbc_256_shared_key, encrypted_bytes) => {
    // aes_cbc_256_shared_key
    // =>
    // aes_cbc_256_shared_key_first_half_16bytes aes_cbc_256_shared_key_second_half_16bytes

    // Seperate key into two parts for checksum and later aes key.
    const aes_cbc_256_shared_key_first_half_16bytes = aes_cbc_256_shared_key.slice(0, 16);
    const aes_cbc_256_shared_key_second_half_16bytes = aes_cbc_256_shared_key.slice(16);

    const aes_cbc_256_shared_key_second_half_16bytes_and_to_be_decrypted_sha256 = encrypted_bytes.slice(0, 32);

    const to_be_decrypted = encrypted_bytes.slice(32);
    // aes kdf
    const sha256_for_aes256 = Crypto.createHash('sha256').update(Buf.concat([aes_cbc_256_shared_key_first_half_16bytes, aes_cbc_256_shared_key_second_half_16bytes_and_to_be_decrypted_sha256])).digest();

    const decipher = Crypto.createDecipheriv('aes-256-cbc', sha256_for_aes256, sha256_for_aes256.slice(0, 16));

    // Return and remove salt.
    const decrypted_data = Buf.concat([decipher.update(to_be_decrypted), decipher.final()]).slice(8);

    return decrypted_data;
  }

  /**
   * @memberof module:SecuredNode
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

  // Setting up node module event listeners.
  this._node_module.on('tunnel-create', (tunnel) => {
    // Setting up server side crypto.
    if(tunnel.returnValue('interface_secured')) {
      // Tunnel secured no need to upgrade.
      this._event_listeners['tunnel-create'](tunnel);
    }
    else {
      let aes_cbc_256_shared_key;
      // Create new tunnel.
      const secured_tunnel = new Tunnel({
        send: (data, callback) => {
          tunnel.send(this._aes_cbc_256_encrypt_function(aes_cbc_256_shared_key, data), callback);
        },
        close: (callback) => {
          tunnel.close(callback);
        }
      });

      secured_tunnel.setValue('interface_name', 'secured_node_wrapped');
      secured_tunnel.setValue('interface_secured', true);
      secured_tunnel.setValue('from_interface', tunnel.returnValue('from_interface'));
      secured_tunnel.setValue('from_connector', tunnel.returnValue('from_connector'));

      secured_tunnel.getEmitter((error, secured_tunnel_emitter) => {
        if (error) callback(error);
        else {
          const rsa_2048_public_key_utf8_encoded = Buf.from(this._rsa_2048_key_pair.public, 'utf8');
          tunnel.on('ready', () => {
            const upgrade_secured_node_bytes = Buf.concat([
              this._secured_node_protocol_code,
              rsa_2048_public_key_utf8_encoded
            ]);

            tunnel.on('data', (data) => {
              if (data[0] === this._secured_node_protocol_code[0]) {


                const decrypted_data = Crypto.privateDecrypt(this._rsa_2048_key_pair.private, data.slice(1));
                const remote_random_bytes = decrypted_data.slice(8); // remove salt.
                aes_cbc_256_shared_key = this._aes_cbc_256_shared_key_derivation_function(rsa_2048_public_key_utf8_encoded, remote_random_bytes);
                tunnel.on('data', (data)=> {
                  try {
                    const decrypted_data = this._aes_cbc_256_decrypt_function(aes_cbc_256_shared_key, data);
                    secured_tunnel_emitter('data', decrypted_data);
                  }
                  catch(error) {
                    secured_tunnel_emitter('error', error);
                  }
                });
                tunnel.on('close', ()=> {
                  secured_tunnel_emitter('close');
                });
                tunnel.on('error', (error)=> {
                  secured_tunnel_emitter('error', error);
                });

                // Finished.
                this._event_listeners['tunnel-create'](secured_tunnel);
                tunnel.send(this._secured_node_comfirm_protocol_code);
                secured_tunnel_emitter('ready');
              } else {
                tunnel.close();
              }
            });

            tunnel.on('error', () => {
              tunnel.close();
            });

            tunnel.on('close', () => {});

            tunnel.send(upgrade_secured_node_bytes);
          });
        }
      });
    }
  });
}

/**
 * @callback module:SecuredNode~callback_of_create_interface
 * @param {integer} interface_id
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {string} interface_name - "websocket", "tcp" or "websocket_secure".
 * @param {object} interface_settings
 * @param {module:SecuredNode~callback_of_create_interface} callback
 * @description Create interface via avaliable interfaces.
 */
SecuredNode.prototype.createInterface = function(interface_name, interface_settings, callback) {
  this._node_module.createInterface(interface_name, interface_settings, callback);
}

/**
 * @callback module:SecuredNode~callback_of_destroy_interface
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {string} interface_id - Which you've obtained from "createInterface".
 * @param {module:SecuredNode~callback_of_destroy_interface} callback
 * @description Destroy exists interface.
 */
SecuredNode.prototype.destroyInterface = function(interface_id, callback) {
  this._node_module.destroyInterface(interface_id, callback);
}

/**
 * @callback module:SecuredNode~callback_of_create_tunnel
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {string} interface_name,
 * @param {object} interface_connect_settings,
 * @param {module:SecuredNode~callback_of_create_tunnel} callback
 * @description Create tunnel via available interfaces.
 */
SecuredNode.prototype.createTunnel = function(interface_name, interface_connect_settings, callback) {
  if(this._node_module.isInterfaceSecured(interface_name)) {
    // Tunnel secured no need to upgrade.
    this._node_module.createTunnel(interface_name, interface_connect_settings, callback);
  }
  else {
    this._node_module.createTunnel(interface_name, interface_connect_settings, (error, tunnel) => {
      if (error) callback(error);
      else {

        let aes_cbc_256_shared_key;
        // Create new tunnel.
        const secured_tunnel = new Tunnel({
          send: (data, callback) => {
            tunnel.send(this._aes_cbc_256_encrypt_function(aes_cbc_256_shared_key, data), callback);
          },
          close: (callback) => {
            tunnel.close(callback);
          }
        });

        secured_tunnel.setValue('interface_name', 'secured_node_wrapped');
        secured_tunnel.setValue('interface_secured', true);
        secured_tunnel.setValue('from_interface', tunnel.returnValue('from_interface'));
        secured_tunnel.setValue('from_connector', tunnel.returnValue('from_connector'));

        secured_tunnel.getEmitter((error, secured_tunnel_emitter) => {
          if (error) callback(error);
          else {
            tunnel.on('ready', () => {
              tunnel.on('data', (data) => {
                if(data[0] === this._secured_node_comfirm_protocol_code[0]) {
                  if(aes_cbc_256_shared_key) {
                    tunnel.on('data', (data)=> {
                      try {
                        const decrypted_data = this._aes_cbc_256_decrypt_function(aes_cbc_256_shared_key, data);
                        secured_tunnel_emitter('data', decrypted_data);
                      }
                      catch(error) {
                        secured_tunnel_emitter('error', error);
                      }
                    });
                    tunnel.on('close', ()=> {
                      secured_tunnel_emitter('close');
                    });
                    tunnel.on('error', (error)=> {
                      secured_tunnel_emitter('error', error);
                    });

                    // Finished.
                    callback(false, secured_tunnel);
                    secured_tunnel_emitter('ready');
                  }
                  else {
                    callback(new Errors.ERR_NOXERVEAGENT_NODE_CREATE_TUNNEL('SecuredNode AES CBC mode shared key has not been created.'));
                  }
                }
                else if (data[0] === this._secured_node_protocol_code[0]) {
                  const rsa_2048_public_key_decoded = Buf.decode(data.slice(1));
                  const random_bytes = Crypto.randomBytes(RandomBytesBytesCount);
                  const salt_8bytes = Crypto.randomBytes(8);
                  aes_cbc_256_shared_key = this._aes_cbc_256_shared_key_derivation_function(data.slice(1), random_bytes);
                  const encrypted_salt_8bytes_random_bytes = Crypto.publicEncrypt(rsa_2048_public_key_decoded,
                    Buf.concat([salt_8bytes, random_bytes])
                  );

                  const upgrade_secured_node_bytes = Buf.concat([
                    this._secured_node_protocol_code,
                    encrypted_salt_8bytes_random_bytes
                  ]);

                  tunnel.send(upgrade_secured_node_bytes);

                } else {
                  tunnel.close();
                }
              });

              tunnel.on('error', () => {
                tunnel.close();
              });

              tunnel.on('close', () => {
                callback(new Errors.ERR_NOXERVEAGENT_NODE_CREATE_TUNNEL('Tunnel closed. SecuredNode cannot be established.'));
              });
            });
          }
        });
      }
    });
  }
}

/**
 * @callback module:SecuredNode~callback_of_on
 * @description callback parameter based on event's type.
 */
/**
 * @memberof module:SecuredNode
 * @param {string} event_name
 * @param {module:SecuredNode~callback_of_on} callback
 * @description Register event listener.
 */
SecuredNode.prototype.on = function(event_name, callback) {
  this._event_listeners[event_name] = callback;
}

/**
 * @callback module:SecuredNode~callback_of_start
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {module:SecuredNode~callback_of_start} callback
 * @description Start running node.
 */
SecuredNode.prototype.start = function(callback) {
  this._node_module.start(callback);
}

/**
 * @callback module:SecuredNode~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:SecuredNode
 * @param {module:SecuredNode~callback_of_close} callback
 * @description Close module.
 */
SecuredNode.prototype.close = function(interface_id, callback) {
  this._node_module.close(callback);
}

module.exports = SecuredNode;

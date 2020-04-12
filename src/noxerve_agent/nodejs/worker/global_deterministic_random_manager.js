/**
 * @file NoXerveAgent global deterministic random manager(GDRM) file. [global_deterministic_random_manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module GlobalDeterministicRandomManager
 */

const Errors = require('../errors');

/**
 * @constructor module:GlobalDeterministicRandomManager
 * @param {object} settings
 * @description GlobalDeterministicRandomManager Object.
 */

function GlobalDeterministicRandomManager(settings) {
  /**
   * @memberof module:GlobalDeterministicRandomManager
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:GlobalDeterministicRandomManager
   * @type {object}
   * @private
   */
  this._static_global_random_seed_4096bytes = settings.static_global_random_seed_4096bytes;
}

GlobalDeterministicRandomManager.prototype.test = null;

module.exports = GlobalDeterministicRandomManager;

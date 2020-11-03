/**
 * @file NoXerveAgent global deterministic random manager(GDRM) file. [global_deterministic_random_manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @author idoleat <dppss92132@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module GlobalDeterministicRandomManager
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const hash = require("crypto").createHash;
const ACORN = new(require('./acorn'));

/**
 * GlobalDeterministicRandomManager Object.
 * @constructor module:GlobalDeterministicRandomManager
 * @param {object} settings
 */
function GlobalDeterministicRandomManager(settings) {
  /**
   * @memberof module:GlobalDeterministicRandomManager
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * Random seeds contained in every worker. 4096 bytes long.
   * @memberof module:GlobalDeterministicRandomManager
   * @type {object}
   * @private
   */
  this._static_global_random_seed_4096bytes = settings.static_global_random_seed_4096bytes;
}

GlobalDeterministicRandomManager.prototype._isInputValid = function(begin_int, end_int, list_length) {
  if (begin_int > end_int) {
    return false;
  }
  if (list_length > (end_int - begin_int + 1)) {
    return false;
  }

  return true;
}

// [Flag]
/**
 * Generate random number with given initialization vector bytes, IVT for short. Expected to have same result with same given IVT due to its the determinism.
 * @param  {buffer}   initialization_vector_bytes  seed
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {Function} callback                     pass the result by callback(result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateIntegerInRange = function(initialization_vector_bytes, begin_int, end_int, callback) {
  if (!this._isInputValid(begin_int, end_int)) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Input of "generateIntegerListInRange" is invalid.'));
    return;
  }
  // [flag] what if overflow?
  let seed = Buf.decodeUInt32BE(initialization_vector_bytes);
  let result = ACORN.random(seed, 1);
  result.forEach(function(element, index) {
    this[index] = Math.round(begin_int + this[index] * (end_int - begin_int));
  }, result);

  callback(false, result);
};

// [Flag] retuen many random integerers
/**
 * [description]
 * @param  {buffer}   initialization_vector_bytes  seed
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {unsigned int}   list_length            length of result list
 * @param  {Function} callback                     pass the result by callback(result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateIntegerListInRange = function(initialization_vector_bytes, begin_int, end_int, list_length, callback) {
  if (!this._isInputValid(begin_int, end_int, list_length)) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Input of "generateIntegerListInRange" is invalid.'));
    return;
  }
  // [flag] what if overflow?
  let seed = Buf.decodeUInt32BE(initialization_vector_bytes);
  // console.log('seed = ' + seed);
  let result = ACORN.random(seed, list_length);
  // console.log('seed in ACORN = ' + ACORN.seed);
  result.forEach(function(element, index) {
    this[index] = Math.round(begin_int + this[index] * (end_int - begin_int));
  }, result);

  callback(false, result);
};

// [Flag]
/**
 * [description]
 * @param  {string, number}   initialization_vector_bytes  seed, will be String()
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {unsigned int}   list_length            length of result array
 * @param  {function} callback                     pass the result by callback(result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateUniqueIntegerListInRange = function(initialization_vector_bytes, begin_int, end_int, list_length, callback) {
  if (!this._isInputValid(begin_int, end_int, list_length)) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Input of "generateUniqueIntegerListInRange" is invalid.'));
    return;
  }
  this.generateIntegerInRange()

  callback(false, []);
}
/*
// Tests Cases
let g = new GlobalDeterministicRandomManager({});
g.generateIntegerListInRange(Buf.from([1,2,3,4,5]), 5, 30, 20, (error, result)=>{
  console.log(result);
});
g.generateIntegerInRange(Buf.from([1,2,3,4,5]), 1, 100, (err, result) => {
  console.log(result);
});
g.generateUniqueIntegerListInRange(Buf.from([1,2,3,4,5]), 5, 40, 13, (error, result)=>{
  console.log(result);
});
*/


module.exports = GlobalDeterministicRandomManager;

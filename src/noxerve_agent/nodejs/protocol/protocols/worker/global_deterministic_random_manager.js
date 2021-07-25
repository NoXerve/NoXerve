/**
 * @file NoXerveAgent global deterministic random manager(GDRM) (Constitution) file. [global_deterministic_random_manager.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @author idoleat <dppss92132@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
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
  this._static_global_random_seed_4096bytes;
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
GlobalDeterministicRandomManager.prototype.importStaticGlobalRandomSeed = function(static_global_random_seed_4096bytes, callback) {
  this._static_global_random_seed_4096bytes = static_global_random_seed_4096bytes;
  ACORN.setInitialValue(this._static_global_random_seed_4096bytes);
  if(callback) callback(false);
}
// [Flag]
/**
 * Generate random number with given initialization vector bytes, IVT for short. Expected to have same result with same given IVT due to its the determinism.
 * @param  {buffer}   initialization_vector_bytes  seed
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {function} callback                     pass the result by callback(error, result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateIntegerInRange = function(initialization_vector_bytes, begin_int, end_int, callback) {
  if (!this._isInputValid(begin_int, end_int)) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Input of "generateIntegerListInRange" is invalid.'));
    return;
  }
  // [flag] what if overflow?
  let seed = Buf.decodeUInt32BE(
    hash('sha256').update(initialization_vector_bytes).digest()
  );
  let result = ACORN.random(seed, 1);
  result.forEach(function(element, index) {
    this[index] = Math.round(begin_int + this[index] * (end_int - begin_int));
  }, result);

  if(callback) callback(false, result[0]);
  else return result[0];
};

// [Flag] retuen many random integerers
/**
 * [description]
 * @param  {buffer}   initialization_vector_bytes  seed
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {unsigned int}   list_length            length of result list
 * @param  {function} callback                     pass the result by callback(error, result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateIntegerListInRange = function(initialization_vector_bytes, begin_int, end_int, list_length, callback) {
  if (!this._isInputValid(begin_int, end_int, list_length)) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Input of "generateIntegerListInRange" is invalid.'));
    return;
  }
  // [flag] what if overflow?
  let seed = Buf.decodeUInt32BE(
    hash('sha256').update(initialization_vector_bytes).digest()
  );
  // console.log('seed = ' + seed);
  let result = ACORN.random(seed, list_length);
  // console.log('seed in ACORN = ' + ACORN.seed);
  result.forEach(function(element, index) {
    this[index] = Math.round(begin_int + this[index] * (end_int - begin_int));
  }, result);

  if(callback) callback(false, result);
  else return result;
};

// [Flag]
/**
 * [description]
 * @param  {string, number}   initialization_vector_bytes  seed, will be String()
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {unsigned int}   list_length            length of result array
 * @param  {boolean}  shuffle                      return result in shuffled or in order?
 * @param  {function} callback                     pass the result by callback(error, result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateUniqueIntegerListInRange = function(initialization_vector_bytes, begin_int, end_int, list_length, shuffle, callback) {
  if (!this._isInputValid(begin_int, end_int, list_length)) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Input of "generateUniqueIntegerListInRange" is invalid.'));
    return;
  }
  let seed = Buf.decodeUInt32BE(
    hash('sha256').update(initialization_vector_bytes).digest()
  );

  // algorithm ref: https://stackoverflow.com/a/29750138/9528175
  let result = [];
  let remaining = end_int - begin_int + 1;
  let probabilities = ACORN.random(seed, remaining);

  for(let i=begin_int; i<= end_int && list_length > 0; i++){
    if(probabilities[i - begin_int] < (list_length / remaining)){
      list_length--;
      result.push(i);
    }
    remaining--;
  }

  if(shuffle){
    // shuffle the result.
  }

  if(callback) callback(false, result);
  else return result;
}

// Tests Cases
/*
let g = new GlobalDeterministicRandomManager({});
g.generateUniqueIntegerListInRange(Buf.from([1,21,2,7,62]), 10, 100, 10, (error, result)=>{
  console.log(result);
});
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

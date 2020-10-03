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
const hash = require("crypto").createHash;
const ACORN = new(require('./ACORN'));

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

const base10 = function (base64_result) {
    // It's a multi to one function
    let result = 0;
    for(let i=0; i<base64_result.length; i++){
        result *= 10;
        result += base64_result.charCodeAt(i);
        result = result%Number.MAX_SAFE_INTEGER;
    }

    return result;
}

const IsInputValid = function (begin_int, end_int, list_length) {
    if(begin_int > end_int) {
        return false;
    }
    if( list_length > ( end_int - begin_int + 1) ) {
        return false;
    }

    return true;
}

// [Flag]
/**
 * Generate random number with given initialization vector bytes, IVT for short. Expected to have same result with same given IVT due to its the determinism.
 * @param  {string}   initialization_vector_bytes  seed
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {Function} callback                     pass the result by callback(result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateIntegerInRange = function(initialization_vector_bytes, begin_int, end_int, callback) {

};

// [Flag] retuen many random integerers
/**
 * [description]
 * @param  {string}   initialization_vector_bytes  seed
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {unsigned int}   list_length            length of result list
 * @param  {Function} callback                     pass the result by callback(result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateIntegerListInRange = function(initialization_vector_bytes, begin_int, end_int, list_length, callback) {
    if(!IsInputValid(begin_int, end_int, list_length)) {
        callback(undefined);
        return undefined;
    }

    let seed = base10(hash('sha1').update(String(initialization_vector_bytes)).digest('base64'));
    console.log('seed = ' + seed);
    let result = ACORN.random(seed, list_length);
    console.log('seed in ACORN = ' + ACORN.seed);
    result.forEach( function(element, index){
        this[index] = Math.round( begin_int + this[index]*(end_int-begin_int) );
    }, result);

    callback(result);
    return(result);
};

// [Flag]
/**
 * [description]
 * @param  {string, number}   initialization_vector_bytes  seed, will be String()
 * @param  {integer}   begin_int                   result >= begin int
 * @param  {integer}   end_int                     result <= end int
 * @param  {unsigned int}   list_length            length of result array
 * @param  {Function} callback                     pass the result by callback(result)
 * @return {integer}                               result
 */
GlobalDeterministicRandomManager.prototype.generateUniqueIntegerListInRange = function(initialization_vector_bytes, begin_int, end_int, list_length, callback) {
    if(!IsInputValid(begin_int, end_int, list_length)) {
        callback(undefined);
        return undefined;
    }
    // begin + (seed*i) mod length

    let seed = base10(hash('sha1').update(String(initialization_vector_bytes)).digest('base64'));
    console.log('seed = ' + seed);


    callback(result);
    return(result);
}

//let g = new GlobalDeterministicRandomManager({});
//console.log(g.generateIntegerListInRange('hello', 5, 30, 20, ()=>{}));

module.exports = GlobalDeterministicRandomManager;

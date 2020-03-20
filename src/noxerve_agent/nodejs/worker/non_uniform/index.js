/**
 * @file NoXerveAgent worker non uniform file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module NonUniform
 */

 const Errors = require('../../errors');

 /**
  * @constructor module:NonUniform
  * @param {object} settings
  * @description NoXerve Agent NonUniform Object. This module is a submodule hooked on NoXerveAgent object.
  */
 function NonUniform(settings) {
   /**
    * @memberof module:NonUniform
    * @type {object}
    * @private
    */
   this._settings = settings;

   /**
    * @memberof module:NonUniform
    * @type {object}
    * @private
    */
    this._event_listeners = {
      'claim-handle': ()=> {},
      'disclaim-handle': ()=> {},
      'scope-create': ()=> {},
      'scope-destroy': ()=> {},
    };

    /**
     * @memberof module:NonUniform
     * @type {booleam}
     * @private
     */
    this._is_claimed = false;

    /**
     * @memberof module:NonUniform
     * @type {object}
     * @private
     * @description "scope_name" to latest_interation, my_interaion, is_locked, dictionary.
     */
    this._scope_dict = {};
 };

/**
 * @callback module:NonUniform~callback_of_claim_non_uniform
 * @param {error} error
 */
/**
 * @memberof module:NonUniform
 * @param {string} non_uniform_name
 * @param {module:NonUniform~callback_of_claim_non_uniform} callback
 * @description Claim a non_uniform, and be part of the workers.
 */
NonUniform.prototype.claim = function(non_uniform_name, callback) {
  this._event_listeners['non_uniform-claim'](non_uniform_name, callback);
}

/**
 * @callback module:NonUniform~callback_of_disclaim_non_uniform
 * @param {error} error
 */
/**
 * @memberof module:NonUniform
 * @param {string} non_uniform_name
 * @param {module:NonUniform~callback_of_disclaim_non_uniform} callback
 * @description DisClaim a non_uniform. Get out of the worker group.
 */
NonUniform.prototype.disclaim = function(non_uniform_name, callback) {
  this._event_listeners['non_uniform-disclaim'](non_uniform_name, callback);
}

// [Flag] Unfinished annotation.
NonUniform.prototype.isClaimed = function() {
  return this._is_claimed;
}

// ***** API for claimed workers start *****
// ***** API for claimed workers start *****

// Each example is a different implementation.

// Example 1 "executeConcurrentTask"
// non_uniform_function_name: read
// non_uniform_function_parameter: {path: "reversi.game_record", data: 1231231}
// scope_name: user.tom
// scope_interation_number: 223

// Example 2 "executeConcurrentTask"
// (this one is not a good implementation since too much scope
// name , and the hierarchy dependencies of file system may cause some troubles.)
// non_uniform_function_name: write
// non_uniform_function_parameter: {file_name: "record_1.txt", data: 1334234}
// scope_name: user.tom.game_data
// scope_interation_number: 321

// Example 3 "executeTask"
// ("executeTask" not gonna emit writeTaskParameterRecord)
// non_uniform_function_name: broadcast_message
// non_uniform_function_parameter: "message 1"
// scope_name: channel_1
// scope_interation_number: null

// // [Flag] Unfinished annotation.
// NonUniform.prototype.createScope = function() {
//   this._event_listeners['']();
// }
//
// // [Flag] Unfinished annotation.
// NonUniform.prototype.destroyScope = function() {
//   this._event_listeners['']();
// }

// [Flag] Unfinished annotation.
NonUniform.prototype.handle = function() {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.request = function() {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.resumeMe = function() {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.suspendMe = function() {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.recoverFromRemoteSnapshot = function(callback) {
  callback();
}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleRecoveryFromSnapshot = function(handler) {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleScopeInformationWrite = function(handler) {
  handler(scope_name, scope_interation_number, callback);
}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleScopeInformationRead = function(handler) {
  handler(scope_name, callback);
}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleScopeInformationDelete = function(handler) {
  handler(scope_name, callback);
}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleConcurrentFunctionRecordWrite = function(handler) {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleConcurrentFunctionRecordRead = function(handler) {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleConcurrentFunctionRecordDelete = function(handler) {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleConcurrentYieldingRecordWrite = function(handler) {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleConcurrentYieldingRecordRead = function(handler) {

}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleConcurrentYieldingRecordDelete = function(handler) {

}

// handleConcurrentTask('write', (yielding_handler_parameter, handle_yielding, start_yielding)=> {
//  handle_yielding('ok', (error, data, eof)=> {
//    if(eof) start_yielding((error, yielding_start_parameter, finish_yield, yield_data) => {
//
//    });
//  });
// });
// [Flag] Unfinished annotation.
NonUniform.prototype.define = function(non_uniform_function_name, non_uniform_function) {
  non_uniform_function(non_uniform_function_parameter, scope_name, finish, yield_data);
  result_callback();
}

// [Flag] Unfinished annotation.
NonUniform.prototype.defineConcurrently = function(non_uniform_function_name, non_uniform_function_do, non_uniform_function_undo) {
  non_uniform_function(non_uniform_function_parameter, scope_name, finish, yield_data, is_master);
}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleYielding = function(field_name, yielding_start_callback) {
  non_uniform_function(non_uniform_function_parameter, scope_name, finish, yield_data);
  result_callback();
}

// [Flag] Unfinished annotation.
NonUniform.prototype.handleYieldingConcurrently = function(field_name, yielding_start_callback, yielding_start_undo_callback) {
  non_uniform_function(non_uniform_function_parameter, scope_name, finish, yield_data, is_master);
}

// ***** API for claimed workers end *****
// ***** API for claimed workers end *****


// ***** API for both unclaimed and claimed workers start *****
// ***** API for both unclaimed and claimed workers start *****

// worker call.
// -> non_uniform worker whatsoever recieved.
// -> emit to non_uniform worker peers.(include non_uniform worker whatsoever itself)
// -> non_uniform worker peers proceed.(include non_uniform worker whatsoever itself)
// [Flag] Unfinished annotation.
NonUniform.prototype.call = function(non_uniform_function_name, non_uniform_function_argument, scope_name, non_uniform_function_callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation. Non-blocking task.
NonUniform.prototype.callConcurrently = function(non_uniform_function_name, non_uniform_function_argument, scope_name, least_synced_scope_percent,  non_uniform_function_callback) {
  this._event_listeners['']();
}

NonUniform.prototype.startYielding = function(field_name, yielding_start_argument, scope_name, yielding_start_callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation. Non-blocking task.
NonUniform.prototype.startYieldingConcurrently = function(field_name, yielding_start_argument, scope_name, least_synced_scope_percent, yielding_start_callback) {
  this._event_listeners['']();
}


/**
 * @callback module:NonUniform~callback_of_on
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} event_name - "error" "close"
 * @param {module:NonUniform~callback_of_on} callback
 * @description Worker events. "ready" triggered if worker fullfill adequate
 * non_uniforms condition. Which needs to be completed by adding connections.
 */
NonUniform.prototype.on = function(event_name, callback) {

}

module.exports = NonUniform;

/**
 * @file NoXerveAgent worker file. [worker.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

'use strict';

/**
 * @module Resource
 */

 const Errors = require('../../errors');

 /**
  * @constructor module:Resource
  * @param {object} settings
  * @description NoXerve Agent Resource Object. This module is a submodule hooked on NoXerveAgent object.
  */
 function Resource(settings) {
   /**
    * @memberof module:Resource
    * @type {object}
    * @private
    */
   this._settings = settings;

   /**
    * @memberof module:Resource
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
     * @memberof module:Resource
     * @type {booleam}
     * @private
     */
    this._is_claimed = false;

    /**
     * @memberof module:Resource
     * @type {object}
     * @private
     * @description "scope_name" to latest_interation, my_interaion, is_locked, dictionary.
     */
    this._scope_dict = {};
 };

/**
 * @callback module:Resource~callback_of_claim_resource
 * @param {error} error
 */
/**
 * @memberof module:Resource
 * @param {string} resource_name
 * @param {module:Resource~callback_of_claim_resource} callback
 * @description Claim a resource, and be part of the workers.
 */
Resource.prototype.claim = function(resource_name, callback) {
  this._event_listeners['resource-claim'](resource_name, callback);
}

/**
 * @callback module:Resource~callback_of_disclaim_resource
 * @param {error} error
 */
/**
 * @memberof module:Resource
 * @param {string} resource_name
 * @param {module:Resource~callback_of_disclaim_resource} callback
 * @description DisClaim a resource. Get out of the worker group.
 */
Resource.prototype.disclaim = function(resource_name, callback) {
  this._event_listeners['resource-disclaim'](resource_name, callback);
}

// [Flag] Unfinished annotation.
Resource.prototype.isClaimed = function() {
  return this._is_claimed;
}

// ***** API for claimed workers start *****
// ***** API for claimed workers start *****

// Each example is a different implementation.

// Example 1 "executeConcurrentTask"
// resource_function_name: read
// resource_function_parameter: {path: "reversi.game_record", data: 1231231}
// scope_name: user.tom
// scope_interation_number: 223

// Example 2 "executeConcurrentTask"
// (this one is not a good implementation since too much scope
// name , and the hierarchy dependencies of file system may cause some troubles.)
// resource_function_name: write
// resource_function_parameter: {file_name: "record_1.txt", data: 1334234}
// scope_name: user.tom.game_data
// scope_interation_number: 321

// Example 3 "executeTask"
// ("executeTask" not gonna emit writeTaskParameterRecord)
// resource_function_name: broadcast_message
// resource_function_parameter: "message 1"
// scope_name: channel_1
// scope_interation_number: null

// // [Flag] Unfinished annotation.
// Resource.prototype.createScope = function() {
//   this._event_listeners['']();
// }
//
// // [Flag] Unfinished annotation.
// Resource.prototype.destroyScope = function() {
//   this._event_listeners['']();
// }

// [Flag] Unfinished annotation.
Resource.prototype.resumeMe = function() {

}

// [Flag] Unfinished annotation.
Resource.prototype.suspendMe = function() {

}

// [Flag] Unfinished annotation.
Resource.prototype.recoverFromRemoteSnapshot = function(callback) {
  callback();
}

// [Flag] Unfinished annotation.
Resource.prototype.handleRecoveryFromSnapshot = function(handler) {

}

// [Flag] Unfinished annotation.
Resource.prototype.handleScopeInformationWrite = function(handler) {
  handler(scope_name, scope_interation_number, callback);
}

// [Flag] Unfinished annotation.
Resource.prototype.handleScopeInformationRead = function(handler) {
  handler(scope_name, callback);
}

// [Flag] Unfinished annotation.
Resource.prototype.handleScopeInformationDelete = function(handler) {
  handler(scope_name, callback);
}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentFunctionRecordWrite = function(handler) {

}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentFunctionRecordRead = function(handler) {

}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentFunctionRecordDelete = function(handler) {

}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentYieldingRecordWrite = function(handler) {

}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentYieldingRecordRead = function(handler) {

}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentYieldingRecordDelete = function(handler) {

}

// handleConcurrentTask('write', (yielding_handler_parameter, handle_yielding, start_yielding)=> {
//  handle_yielding('ok', (error, data, eof)=> {
//    if(eof) start_yielding((error, yielding_start_parameter, finish_yield, yield_data) => {
//
//    });
//  });
// });
// [Flag] Unfinished annotation.
Resource.prototype.define = function(resource_function_name, resource_function) {
  resource_function(resource_function_parameter, scope_name, finish, yield_data);
  result_callback();
}

// [Flag] Unfinished annotation.
Resource.prototype.defineConcurrently = function(resource_function_name, resource_function) {
  resource_function(resource_function_parameter, scope_name, finish, yield_data, is_master);
}

// [Flag] Unfinished annotation.
Resource.prototype.handleYielding = function(field_name, resource_function) {
  resource_function(resource_function_parameter, scope_name, finish, yield_data);
  result_callback();
}

// [Flag] Unfinished annotation.
Resource.prototype.handleYieldingConcurrently = function(field_name, resource_function) {
  resource_function(resource_function_parameter, scope_name, finish, yield_data, is_master);
}

// ***** API for claimed workers end *****
// ***** API for claimed workers end *****


// ***** API for both unclaimed and claimed workers start *****
// ***** API for both unclaimed and claimed workers start *****

// worker call.
// -> resource worker whatsoever recieved.
// -> emit to resource worker peers.(include resource worker whatsoever itself)
// -> resource worker peers proceed.(include resource worker whatsoever itself)
// [Flag] Unfinished annotation.
Resource.prototype.call = function(resource_function_name, resource_function_argument, scope_name, resource_function_callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation. Non-blocking task.
Resource.prototype.callConcurrently = function(resource_function_name, resource_function_argument, scope_name, resource_function_callback) {
  this._event_listeners['']();
}

Resource.prototype.startYielding = function(field_name, yielding_start_argument, scope_name, yielding_start_callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation. Non-blocking task.
Resource.prototype.startYieldingConcurrently = function(field_name, yielding_start_argument, scope_name, yielding_start_callback) {
  this._event_listeners['']();
}


/**
 * @callback module:Resource~callback_of_on
 * @param {error} error
 */
/**
 * @memberof module:Worker
 * @param {string} event_name - "error" "close"
 * @param {module:Resource~callback_of_on} callback
 * @description Worker events. "ready" triggered if worker fullfill adequate
 * resources condition. Which needs to be completed by adding connections.
 */
Resource.prototype.on = function(event_name, callback) {

}

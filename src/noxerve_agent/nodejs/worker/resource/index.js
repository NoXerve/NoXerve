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
// task_name: read
// task_parameter: {path: "reversi.game_record", data: 1231231}
// scope_name: user.tom
// scope_interation: 223

// Example 2 "executeConcurrentTask"
// (this one is not a good implementation since too much scope
// name , and the hierarchy dependencies of file system may cause some troubles.)
// task_name: write
// task_parameter: {file_name: "record_1.txt", data: 1334234}
// scope_name: user.tom.game_data
// scope_interation: 321

// Example 3 "executeTask"
// ("executeTask" not gonna emit writeTaskParameterRecord)
// task_name: broadcast_message
// task_parameter: "message 1"
// scope_name: channel_1
// scope_interation: null

// [Flag] Unfinished annotation.
Resource.prototype.createScope = function() {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.destroyScope = function() {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.writeConcurrentTaskParameterRecord = function(task_name, task_parameter, scope_name, scope_interation) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.readConcurrentTaskParameterRecord = function(task_name, task_parameter, scope_name, scope_interation) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.deleteConcurrentTaskParameterRecord = function(task_name, task_parameter, scope_name, scope_interation) {
  this._event_listeners['']();
}

// handleConcurrentTask('write', (yielding_handler_parameter, handle_yielding, start_yielding)=> {
//  handle_yielding('ok', (error, data, eof)=> {
//    if(eof) start_yielding((error, yielding_start_parameter, finish_yield, yield_data) => {
//
//    });
//  });
// });
// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentTask = function(task_name, task_handler) {
  task_handler(task_parameter, scope_name, finish, yield_data, is_master);
  result_callback();
}

// [Flag] Unfinished annotation.
Resource.prototype.handleTask = function(task_name, task_handler) {
  task_handler(task_parameter, scope_name, finish, yield_data);
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
Resource.prototype.executeConcurrentTask = function(task_name, task_parameter, scope_name, callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation. Non-blocking task.
Resource.prototype.executeTask = function(task_name, task_parameter, scope_name, callback) {
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

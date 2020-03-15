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

// [Flag] Unfinished annotation.
Resource.prototype.createScope = function() {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.destroyScope = function() {
  this._event_listeners['']();
}

// Example
// task_name: read
// task_parameter: reversi.game_record
// scope_name: user.tom
// scope_interation: 223

// [Flag] Unfinished annotation.
Resource.prototype.writeTaskParameterRecord = function(task_name, task_parameter, scope_name, scope_interation) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.readTaskParameterRecord = function(task_name, task_parameter, scope_name, scope_interation) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.deleteTaskParameterRecord = function(task_name, task_parameter, scope_name, scope_interation) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.handleConcurrentTask = function(task_name, scope_name, task_handler_callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.executeConcurrentTask = function(task_name, task_parameter, scope_name) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.handleTask = function(task_name, scope_name, task_handler_callback) {
  this._event_listeners['']();
}

// [Flag] Unfinished annotation.
Resource.prototype.executeTask = function(task_name, task_parameter, scope_name) {
  this._event_listeners['']();
}

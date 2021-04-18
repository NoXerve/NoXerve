/**
 * @file NoXerveAgent worker shoaling manager index file. [index.js]
 * @author idoleat <dppss92132@gmail.com>
 */

'use strict';

 /**
  * @module WorkerShoaling
  */

 const Errors = require('../../../../../errors');

 function WorkerShoaling(settings){
  /**
    * @memberof module:WorkerShoaling
    * @type {object}
    * @private
    */
  this._settings = settings;

  this._event_listener_dict = {
  }
 }

 WorkerShoaling.prototype.on = function(event_name, event_listener){
   this._event_listener_dict[event_name] = event_listener;
 }

 

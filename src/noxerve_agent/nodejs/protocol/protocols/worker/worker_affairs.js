/**
 * @file NoXerveAgent worker protocol worker_affairs file. [worker_affairs.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerAffairsProtocol
 */

const Errors = require('../../../errors');
const Buf = require('../../../buffer');
const Utils = require('../../../utils');
const NSDT = require('../../../nsdt');

/**
 * @constructor module:WorkerAffairsProtocol
 * @param {object} settings
 * @description NoXerve Agent ServiceProtocol Object. Protocols of service module.
 */

 function WorkerAffairsProtocol(settings) {
   /**
    * @memberof module:WorkerProtocol
    * @type {object}
    * @private
    */
   this._settings = settings;
 }

 /**
  * @memberof module:WorkerAffairsProtocol
  * @param {buffer} synchronize_information
  * @return {buffer} synchronize_acknowledgement_information
  * @description Synchronize handshake from remote emitter.
  */
 WorkerAffairsProtocol.prototype.synchronize = function(synchronize_information, onError, onAcknowledge) {

 }

module.exports = WorkerAffairsProtocol;

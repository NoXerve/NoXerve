/**
 * @file NoXerveAgent NoXerve Supported Data Type callbable structure remote file. [remote.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */


'use strict';

/**
 * @module CallableStructureRemote
 */

/**
 * @constructor module:CallableStructureRemote
 * @param {object} settings
 * @description CallableStructure multiplexing and demultiplexing strutures

 */
function CallableStructureRemote(settings) {
  /**
   * @memberof module:CallableStructureRemote
   * @type {object}
   * @private
   */
  this._settings = settings;
}

module.exports = CallableStructureRemote;

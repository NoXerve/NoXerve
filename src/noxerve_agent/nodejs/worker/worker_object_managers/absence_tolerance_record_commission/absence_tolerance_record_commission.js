/**
 * @file NoXerveAgent worker absence tolerance record commission index file. [absence_tolerance_record_commission.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module AbsenceToleranceRecordCommission
 */

const Errors = require('../../../errors');
/**
 * @constructor module:AbsenceToleranceRecordCommission
 * @param {object} settings
 * @description NoXerve Agent AbsenceToleranceRecordCommission Object. Using nooxy Absence Tolerance Record algorithm.
 */

function AbsenceToleranceRecordCommission(settings) {
  /**
   * @memberof module:WorkerScopeManager
   * @type {object}
   * @private
   */
   this._worker_scope = settings.worker_scope;
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.updateRecord = function(record_name) {

}

// [Flag]
AbsenceToleranceRecordCommission.prototype.readRecord = function() {

}

module.exports = AbsenceToleranceRecordCommission;

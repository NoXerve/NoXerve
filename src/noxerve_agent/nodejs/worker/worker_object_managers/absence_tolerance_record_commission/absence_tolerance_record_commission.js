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

const Utils = require('../../../utils');
const Buf = require('../../../buffer');
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

  /**
   * @memberof module:WorkerScopeManager
   * @type {integer}
   * @private
   */
   this._commission_peers_count = settings.worker_scope.returnScopePeersCount();

   /**
    * @memberof module:WorkerScopeManager
    * @type {object}
    * @private
    */
   this._hash_manager = settings.hash_manager;

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._update_rate_percentage_int = settings.update_rate_percentage_int;

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._update_peers_count_int = Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._update_rate_percentage_int/100)) + 1);

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._sync_rate_percentage_int = 100 - settings.update_rate_percentage_int;

  /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._sync_peers_count_int = Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._sync_rate_percentage_int/100)));

   /**
    * @memberof module:WorkerScopeManager
    * @type {object}
    * @private
    */
    // record_name
    // -> update_iterations
    // -> record_value
    this._record_dict = settings.records_dict;
}

AbsenceToleranceRecordCommission.prototype._ProtocolCodes = {
  update_record: Buf.from([0x00]),
  check_record_update_interation: Buf.from([0x01]),
  sync_record_value: Buf.from([0x02])
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.returnRecords = function() {
  return this._record_dict;
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.updateRecordValue = function(record_name, update_rate_percentage_int, value, callback) {
  const selected_commission_peers = Utils.generateUniqueIntegerListInRangeRandomly(1, this._commission_peers_count, this._update_peers_count_int);
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.syncRecord = function(record_name) {
  const selected_commission_peers = Utils.generateUniqueIntegerListInRangeRandomly(1, this._commission_peers_count, this._sync_peers_count_int);
  // console.log(this._sync_peers_count_int, selected_commission_peers, this._sync_rate_percentage_int);
  // this._worker_scope.
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.returnRecordValue = function(record_name) {
  return this._record_dict[record_name];
}

AbsenceToleranceRecordCommission.prototype.start = function(callback) {
  this._worker_scope.on('request-response', (scope_peer_id, request_data_bytes, response) => {
    const protocol_code_int = request_data_bytes[0];
    if(protocol_code_int === this._ProtocolCodes.update_record[0]) {

    }
    else if(protocol_code_int === this._ProtocolCodes.check_record_update_interation[0]) {

    }
    else if(protocol_code_int === this._ProtocolCodes.sync_record_value[0]) {

    }
  });
  callback(false);
}

module.exports = AbsenceToleranceRecordCommission;

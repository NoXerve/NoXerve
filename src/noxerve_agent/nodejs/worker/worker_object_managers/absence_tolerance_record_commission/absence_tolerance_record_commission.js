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
    * @type {object}
    * @private
    */
   this._nsdt_embedded_protocol = settings.nsdt_embedded_protocol;

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._min_successful_update_rate_percentage_int = Math.max(50, settings.min_successful_update_rate_percentage_int);

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._min_successful_update_peers_count_int = Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._min_successful_update_rate_percentage_int/100)) + 1);

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
    this._update_peers_count_int = Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._update_rate_percentage_int/100)));

    this._update_peers_count_int = Math.max(this._update_peers_count_int, this._min_successful_update_peers_count_int);

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
    this._sync_peers_count_int = Math.max(1, Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._sync_rate_percentage_int/100))));

   /**
    * @memberof module:WorkerScopeManager
    * @type {object}
    * @private
    */
    // record_name
    // -> update_iterations
    // -> record_value
    // -> on_duty_peer_id
    // -> on_duty_absense_challenge_dict
    // -> -> me_on_duty_absense_replicate_multicasted (bool)
    // -> -> peers_with_on_duty_absense_replicate (int list)
    // -> -> new_update_iterations (int)
    // -> -> new_on_duty_peer_id (int)
    this._record_dict = settings.record_dict;

    /**
     * @memberof module:WorkerScopeManager
     * @type {object}
     * @private
     */
    this._me_updating_record_dict = {};
}

AbsenceToleranceRecordCommission.prototype._ProtocolCodes = {
  check_alive_multicast: Buf.from([0x00]),
  update_record_request: Buf.from([0x01]),
  update_record_multicast: Buf.from([0x02]),
  on_duty_absense_challenge_multicast: Buf.from([0x03]),
  on_duty_absense_replicate_multicast: Buf.from([0x04]),
  check_record_update_iterations_request: Buf.from([0x03]),
  sync_record_value_request: Buf.from([0x04])
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.returnRecords = function() {
  return this._record_dict;
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.updateRecordValue = function(record_name, value, callback) {
  if(this._me_updating_record_dict[record_name]) {
    callback(new Errors.ERR_NOXERVEAGENT_WORKER('You cannot update a record twice concurrently.'));
  }
  else {
    this._me_updating_record_dict[record_name] = true;
    const selected_commission_peers = Utils.generateUniqueIntegerListInRangeRandomly(1, this._commission_peers_count, this._update_peers_count_int);
    const update_iterations = (this._record_dict[record_name])?this._record_dict[record_name].update_iterations:1;

    const data_bytes = Buf.concat([
      this._ProtocolCodes.check_alive_multicast
    ]);

    const a_worker_response_listener = () => {

    };

    const finished_listener = () => {

    };

    this._worker_scope.multicastRequest(selected_commission_peers, data_bytes, a_worker_response_listener, finished_listener);
  }
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
    if(protocol_code_int === this._ProtocolCodes.check_alive_multicast[0]) {
      // Prevent collision.

    }
    else if(protocol_code_int === this._ProtocolCodes.check_record_update_interation[0]) {
      response(Buf.concat());
    }
    else if(protocol_code_int === this._ProtocolCodes.sync_record_value[0]) {

    }
  });
  callback(false);
}

module.exports = AbsenceToleranceRecordCommission;

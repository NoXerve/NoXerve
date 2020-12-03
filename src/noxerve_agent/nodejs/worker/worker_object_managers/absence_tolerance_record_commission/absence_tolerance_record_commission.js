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
    * @type {object}
    * @private
    */
   this._global_deterministic_random_manager = settings.global_deterministic_random_manager;

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
   this._commission_peer_alive_expire_mills_int = 500;

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
    this._min_successful_update_commission_peers_count_int = Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._min_successful_update_rate_percentage_int/100)) + 1);

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._update_rate_percentage_int = Math.max(this._min_successful_update_rate_percentage_int, settings.update_rate_percentage_int);

   /**
    * @memberof module:WorkerScopeManager
    * @type {integer}
    * @private
    */
    this._update_commission_peers_count_int = Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._update_rate_percentage_int/100)) + 1);

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
    this._sync_commission_peers_count_int = Math.max(1, Math.min(this._commission_peers_count, Math.ceil(this._commission_peers_count*(this._sync_rate_percentage_int/100))));

   /**
    * @memberof module:WorkerScopeManager
    * @type {object}
    * @private
    */
    // record_name
    // -> update_iterations
    // -> record_value
    // -> on_duty_commission_peer_id

    // -> me_on_duty_dict
    // -> -> updating
    // -> -> updating

    // -> on_duty_absense_challenge_dict
    // -> -> me_on_duty_absense_replicate_multicasted (bool)
    // -> -> commission_peers_with_on_duty_absense_replicate (int list)
    // -> -> new_update_iterations (int)
    // -> -> new_on_duty_commission_peer_id (int)
    this._record_dict = settings.record_dict;

    /**
     * @memberof module:WorkerScopeManager
     * @type {object}
     * @private
     */
     // latest_check_mills
     // alive
    this._commission_peer_alive_dict = {};
}

AbsenceToleranceRecordCommission.prototype._ProtocolCodes = {
  check_alive_request: Buf.from([0x00]),
  update_record_request: Buf.from([0x01]),
  update_record_multicast: Buf.from([0x02]),
  on_duty_absense_challenge_multicast: Buf.from([0x03]),
  on_duty_absense_replicate_multicast: Buf.from([0x04]),
  check_record_update_iterations_request: Buf.from([0x03]),
  sync_record_value_request: Buf.from([0x04]),

  accept: Buf.from([0x01]),
  reject: Buf.from([0x00]),
  record_name_not_found_reject: Buf.from([0x02]),
  concurrently_update_reject: Buf.from([0x03]),
  not_on_duty_reject: Buf.from([0x04]),
  no_enough_alive_peers: Buf.from([0x05]),
}

AbsenceToleranceRecordCommission.prototype._getAliveCommissionPeers = function(callback) {
  const result = [];
  const commission_peers_to_be_checked = [];
  for(let key in this._commission_peer_alive_dict) {
    const commission_peer_latest_alive_mills = this._commission_peer_alive_dict[key].latest_check_mills;
    if(!commission_peer_latest_alive_mills) {
      commission_peers_to_be_checked.push(parseInt(key));
    }
    else if(Date.now() - commission_peer_latest_alive_mills > this._commission_peer_alive_expire_mills_int) {
      commission_peers_to_be_checked.push(parseInt(key));
    }
    else {
      if(this._commission_peer_alive_dict[key].alive) {
        result.push(parseInt(key));
      }
    }
  }

  if(commission_peers_to_be_checked.length) {

    const data_bytes = Buf.concat([
      this._ProtocolCodes.check_alive_request
    ]);

    const a_worker_response_listener = (commission_peer_id, synchronize_error, response_data_bytes, confirm_error_finish_status) => {
      if(!commission_peer_id) {
        confirm_error_finish_status(synchronize_error, false);
        return;
      }
      this._commission_peer_alive_dict[commission_peer_id].latest_check_mills = Date.now();
      if(synchronize_error) {
        this._commission_peer_alive_dict[commission_peer_id].alive = false;
        confirm_error_finish_status(synchronize_error, false);
      }
      else if (response_data_bytes[0] === this._ProtocolCodes.check_alive_request[0]) {
        this._commission_peer_alive_dict[commission_peer_id].alive = true;
        result.push(commission_peer_id);
        confirm_error_finish_status(synchronize_error, true);
      }
      else {
          this._commission_peer_alive_dict[commission_peer_id].alive = false;
          confirm_error_finish_status(synchronize_error, false);
      }
    };

    const finished_listener = (error, finished_commission_peer_list) => {
      callback(false, result);
    };

    this._worker_scope.multicastRequest(commission_peers_to_be_checked, data_bytes, a_worker_response_listener, finished_listener);
  }
  else {
    callback(false, result);
  }
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.returnRecords = function() {
  return this._record_dict;
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.updateRecordValue = function(record_name, value, callback) {
  const data_bytes = Buf.concat([
    this._ProtocolCodes.update_record_request,
    this._hash_manager.hashString4Bytes(record_name),
    this._nsdt_embedded_protocol.encode(value)
  ]);
  this._worker_scope.request(this._record_dict[record_name].on_duty_commission_peer_id, data_bytes, (error, response_data_bytes) => {
    console.log(error, response_data_bytes);
    if(response_data_bytes[0] === this._ProtocolCodes.accept[0]) {

    }
    else if(response_data_bytes[0] === this._ProtocolCodes.concurrently_update_reject[0]) {
      callback(new Errors.ERR_NOXERVEAGENT_WORKER('You cannot update a record twice concurrently.'));
    }
    else if(response_data_bytes[0] === this._ProtocolCodes.no_enough_alive_peers[0]) {
      callback(new Errors.ERR_NOXERVEAGENT_WORKER('No enough alive peers. Need '+this._update_commission_peers_count_int+' peers alive.'));
    }
  });
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.syncRecord = function(record_name, callback) {
  const selected_commission_peers = Utils.generateUniqueIntegerListInRangeRandomly(1, this._commission_peers_count, this._sync_commission_peers_count_int);
  // console.log(this._sync_commission_peers_count_int, selected_commission_peers, this._sync_rate_percentage_int);
  // this._worker_scope.
}

// [Flag]
AbsenceToleranceRecordCommission.prototype.returnRecordValue = function(record_name) {
  return this._record_dict[record_name];
}

AbsenceToleranceRecordCommission.prototype.start = function(callback) {
  this._worker_scope.on('request-response', (commission_peer_id, request_data_bytes, response) => {
    const protocol_code_int = request_data_bytes[0];

    // Check alive
    if(protocol_code_int === this._ProtocolCodes.check_alive_request[0]) {
      response(this._ProtocolCodes.check_alive_request);
    }

    // Update record request
    else if(protocol_code_int === this._ProtocolCodes.update_record_request[0]) {
      const record_name = this._hash_manager.stringify4BytesHash(request_data_bytes.slice(1, 5));
      const value = this._nsdt_embedded_protocol.decode(request_data_bytes.slice(5));

      if(record_name) {
        // console.log(this._worker_scope.MyScopePeerId);
        if(this._record_dict[record_name].on_duty_commission_peer_id === this._worker_scope.MyScopePeerId) {
          if(this._record_dict[record_name].me_on_duty_dict.updating) {
            response(this._ProtocolCodes.concurrently_update_reject);
          }
          else {
            this._record_dict[record_name].me_on_duty_dict.updating = true;
            this._getAliveCommissionPeers((error, result) => {
              console.log('atrc test', result);
              if(result.length >= this._update_commission_peers_count_int) {
                  const selected_commission_peers = Utils.generateUniqueIntegerListInRangeRandomly(1, this._commission_peers_count, this._update_commission_peers_count_int);
                //   const update_iterations = (this._record_dict[record_name])?this._record_dict[record_name].update_iterations:1;
                //
                //   const data_bytes = Buf.concat([
                //     this._ProtocolCodes.check_alive_request
                //   ]);
                //
                //   const a_worker_response_listener = () => {
                //
                //   };
                //
                //   const finished_listener = () => {
                //
                //   };
                //
                //   this._worker_scope.multicastRequest(selected_commission_peers, data_bytes, a_worker_response_listener, finished_listener);
              }
              else {
                response(this._ProtocolCodes.no_enough_alive_peers);
              }
            });
          }
        }
        else {
          response(Buf.concat([
            this._ProtocolCodes.not_on_duty_reject,
            Buf.encodeUInt32BE(this._record_dict[record_name].on_duty_commission_peer_id)
          ]));
        }
      }
      else {
        response(this._ProtocolCodes.record_name_not_found_reject);
      }
    }


    else if(protocol_code_int === this._ProtocolCodes.check_record_update_iteration[0]) {
      response(Buf.concat());
    }


    else if(protocol_code_int === this._ProtocolCodes.sync_record_value[0]) {

    }
  });
  for(let record_name in this._record_dict) {
    const record_name_hash_4bytes = this._hash_manager.hashString4Bytes(record_name);
    if(!this._record_dict[record_name].update_iterations) {
      this._record_dict[record_name].update_iterations = 1;
    }
    if(!this._record_dict[record_name].on_duty_commission_peer_id) {
      this._record_dict[record_name].on_duty_commission_peer_id = this._global_deterministic_random_manager.generateIntegerInRange(record_name_hash_4bytes, 1, this._commission_peers_count);
    }
    this._record_dict[record_name].me_on_duty_dict = {
      updating: false
    };
  }
  for(let i = 0; i < this._commission_peers_count; i++) {
    this._commission_peer_alive_dict[i+1] = {
      alive: false,
      latest_check_mills: 0
    };
  }
  callback(false);
}

module.exports = AbsenceToleranceRecordCommission;

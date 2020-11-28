/**
 * @file NoXerveAgent worker absence tolerance record commission manager index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module AbsenceToleranceRecordCommissionManager
 */

const Errors = require('../../../errors');
const AbsenceToleranceRecordCommission = require('./absence_tolerance_record_commission');

/**
 * @constructor module:AbsenceToleranceRecordCommissionManager
 * @param {object} settings
 * @description NoXerve Agent AbsenceToleranceRecordCommissionManager Object.
 */

function AbsenceToleranceRecordCommissionManager(worker_subprotocol_object_managers, hash_manager) {
  /**
   * @memberof module:AbsenceToleranceRecordCommissionManager
   * @type {object}
   * @private
   */
  this._worker_subprotocol_object_managers = worker_subprotocol_object_managers;
  /**
   * @memberof module:AbsenceToleranceRecordCommissionManager
   * @type {object}
   * @private
   */
  this._hash_manager = hash_manager;
}


/**
 * @callback module:AbsenceToleranceRecordCommissionManager~callback_of_create
 * @param {object} worker_group
 * @param {error} error
 */
/**
 * @memberof module:AbsenceToleranceRecordCommissionManager
 * @param {string} worker_group_purpose_name - The purpose for this worker group.
 * @param {list} worker_peers_worker_id_list - The worker peers that you want to communicate with.
 * @param {module:Worker~callback_of_create} callback
 * @description Create a worker group in order to communicate with another worker.
 */
AbsenceToleranceRecordCommissionManager.prototype.create = function(atr_commission_purpose_name, settings, callback) {
  const commission_peers_worker_id_list = settings.coommission_peers;
  const update_rate_percentage_int = settings.update_rate;
  const record_dict = settings.records;
  this._worker_subprotocol_object_managers.worker_scope.create(atr_commission_purpose_name, commission_peers_worker_id_list, (error, worker_scope) => {
    if(error) {callback(error); return;};
    const atr_commission = new AbsenceToleranceRecordCommission({
      worker_scope: worker_scope,
      update_rate_percentage_int: update_rate_percentage_int,
      record_dict: record_dict,
      hash_manager: hash_manager
    });
    atr_commission.start((error) => {
      callback(error, atr_commission);
    });
  });
}

module.exports = {
  register_code: 3,
  module: AbsenceToleranceRecordCommissionManager
};

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

function AbsenceToleranceRecordCommissionManager(worker_subprotocol_object_managers) {

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
AbsenceToleranceRecordCommissionManager.prototype.create = function(atr_commission_purpose_name, worker_peers_worker_id_list, callback) {
  this._worker_subprotocol_object_managers.worker_scope.create(atr_commission_purpose_name, worker_peers_worker_id_list, (error, worker_scope) => {
    if(error) {callback(error); return;};
    const atr_commission = new AbsenceToleranceRecordCommission({
      worker_scope: worker_scope
    });
    callback(error, atr_commission);
  });
}

module.exports = {
  register_code: 3,
  module: AbsenceToleranceRecordCommissionManager
};

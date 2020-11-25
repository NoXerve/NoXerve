/**
 * @file NoxServiceSystem Service cabinet commission file. [cabinet_commission.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Check if NoxServiceSystemService initailized.
 */

'use strict';


const MAX_DEPARTMENT_MEMBER = 128;

function CabinetCommission(settings) {
  this._settings = settings;
  this._noxerve_agent_worker = settings.noxerve_agent_worker;
  this._cabinet_worker_peers = {};
};

CabinetCommission.prototype.joinDepartments = function(department_name) {

};

CabinetCommission.prototype.isWorkerInDepartment = function(department_name) {

};

CabinetCommission.prototype.whoIsInDepartment = function(department_name) {

};

CabinetCommission.prototype.start = function(callback) {

};

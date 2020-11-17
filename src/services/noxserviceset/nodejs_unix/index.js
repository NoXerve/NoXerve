

function Service(nssystem_system_space_apis) {
  this._nssystem_system_space_apis = nssystem_system_space_apis;
}

Service.prototype.start = function(is_service_starting, finish_start) {
  this._nssystem_system_space_apis.getServiceStatus('org.noxerve.fundamental.noxserviceset');
}

Service.prototype.close = function(is_service_closing, finish_start) {

}

module.exports = Service;

Channel.prototype.ProtocolCodes = {
  onetime_data: Buf.from([0x00]),
  request_response: Buf.from([0x01]),
  handshake: Buf.from([0x01])
};
// Onetime data

// [Flag]
Channel.prototype.send = function(callback) {

}

// [Flag]
Channel.prototype.multicast = function(callback) {

}

// [Flag]
Channel.prototype.broadcast = function(callback) {

}

// [Flag]
Channel.prototype.onData = function(callback) {

}

// Request response

// [Flag]
Channel.prototype.requestResponse = function(callback) {

}

// [Flag]
Channel.prototype.multicastRequestResponse = function(callback) {

}

// [Flag]
Channel.prototype.broadcastRequestResponse = function(callback) {

}

// [Flag]
Channel.prototype.onRequestResponse = function(callback) {

}

// Handshake

// [Flag]
Channel.prototype.handshake = function(callback) {

}

// [Flag]
Channel.prototype.multicastHandShake = function(callback) {

}

// [Flag]
Channel.prototype.broadcastHandShake = function(callback) {

}

// [Flag]
Channel.prototype.onHandShake = function(callback) {

}

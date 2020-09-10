locker and queue

// [Flag] Unfinished comments.
WorkerScopeManager.prototype.create = function(scope_name, scope_peers_settings, callback) {
  // const sorted_worker_id_list = worker_peer_worker_id_list.sort();
  // const worker_ids_hash = Utils.hash4BytesMd5(Buf.concat(
  //   sorted_worker_peer_worker_id_list.map(worker_id => Buf.encodeUInt32BE(worker_id))
  // ));

  // const worker_ids_hash = Utils.hash4BytesMd5(Buf.concat(
  //   worker_id_list.map(worker_id => Buf.encodeUInt32BE(worker_id))
  // ));

  const scope_name_hash = Utils.hash4BytesMd5(scope_name);

  // const worker_ids_hash_base64 = worker_ids_hash.toString('base64');
  const scope_name_hash_base64 = scope_name_hash.toString('base64');

  // const base64_key = worker_ids_hash_base64 + scope_name_hash_base64;

  if (this._base64_to_scope_dict[scope_name_hash_base64]) {
    callback(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('This scope has been registered already.'));
    return;
  }
  else {
    const deregister = () => {
      delete this._base64_to_scope_dict[scope_name_hash_base64];
    };

    const scope = new WorkerScope({
      scope_peers_settings: scope_peers_settings,
      deregister: deregister,
      open_handshake_function: (scope_peer_id, synchronize_information, acknowledge_synchronization, finish_handshake) => {
        const target_worker_peer_worker_id = worker_id_list[scope_peer_id];
        const my_worker_authenticity_bytes = this._encodeAuthenticityBytes();

        const scope_synchronize_information = Buf.concat([
          this._ProtocolCodes.worker_scope,
          scope_name_hash,
          Buf.encodeUInt32BE(my_worker_authentication_data_bytes.length),
          my_worker_authentication_data_bytes,
          synchronize_information
        ]);

        const decorated_acknowledge_synchronization = (error, synchronize_acknowledgement_information, next) => {
          if(scope_error) {
            acknowledge_synchronization(scope_error, null, next);
          }
          else {
            if(synchronize_acknowledgement_information[0] === this._ProtocolCodes.worker_scope) {
              if(synchronize_acknowledgement_information[1] === this._ProtocolCodes.accept) {
                const remote_worker_peer_authenticity_bytes_length = Buf.decodeUInt32BE(synchronize_acknowledgement_information.slice(2, 6));
                const remote_worker_peer_authenticity_bytes = synchronize_acknowledgement_information.slice(6, 6 + remote_worker_peer_authenticity_bytes_length);

                this._validateAuthenticityBytes(remote_worker_peer_authenticity_bytes, (error, is_authenticity_valid, remote_worker_peer_worker_id) => {
                  if (is_authenticity_valid) {
                    const scope_synchronize_acknowledgement_information = synchronize_acknowledgement_information.slice(6 + remote_worker_peer_authenticity_bytes_length);
                    const decorated_next = (scope_acknowledge_information) => {
                      next(Buf.concat([
                        this._ProtocolCodes.worker_scope,
                        this._ProtocolCodes.accept,
                        scope_acknowledge_information
                      ]));
                    };
                    acknowledge_synchronization(scope_error, scope_synchronize_acknowledgement_information, next);
                  }
                  else {
                    next(Buf.concat([
                      this._ProtocolCodes.worker_scope,
                      this._ProtocolCodes.authentication_reason_reject_2_bytes // Reject. Authenticication error.
                    ]));
                  }
                });
              }
              else if (synchronize_acknowledgement_information[1] === this._ProtocolCodes.reject) {
                if(synchronize_acknowledgement_information[2] === this._ProtocolCodes.unknown_reason_reject_2_bytes[1]) {
                  next(false);
                  acknowledge_synchronization(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Rejected by unknown reason.'), null, () => {});
                }
                else if (synchronize_acknowledgement_information[2] === this._ProtocolCodes.authentication_reason_reject_2_bytes[1]) {
                  next(false);
                  acknowledge_synchronization(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Worker authentication error.'), null, () => {});
                }
                else {
                  next(false);
                  acknowledge_synchronization(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), null, () => {});
                }
              }
              else {
                next(false);
                acknowledge_synchronization(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), null, () => {});
              }
            }
            else {
              next(false);
              acknowledge_synchronization(new Errors.ERR_NOXERVEAGENT_PROTOCOL_WORKER('Unknown protocol.'), null, () => {});
            }
          }
        };

        this._openHandshakeByWorkerId(target_worker_peer_worker_id, scope_synchronize_information, decorated_acknowledge_synchronization, finish_handshake);
      }
    });

    // _scopes_with_base64_keys_dict[];
    callback(false, scope);
  }
}

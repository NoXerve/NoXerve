/**
 * @file NoXerveAgent worker socket file. [worker_socket.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module WorkerSocket
 */

const Errors = require('../../errors');

/**
 * @constructor module:WorkerSocket
 * @param {object} settings
 * @description NoXerve Agent Activity WorkerSocket Object.
 */

function WorkerSocket(settings) {
  /**
   * @memberof module:WorkerSocket
   * @type {object}
   * @private
   */
  this._settings = settings;

  /**
   * @memberof module:WorkerSocket
   * @type {boolean}
   * @private
   */
  this._closed = false;

  /**
   * @memberof module:WorkerSocket
   * @type {object}
   * @private
   */
  this._event_listeners = {
    'function-call-request': (worker_socket_function_name, worker_socket_function_parameter, return_value, yield_value) => {
      // return_value(error, NSDT), yield(NSDT)
      this._worker_socket_functions[worker_socket_function_name](worker_socket_function_parameter, return_value, yield_value);
    },
    'passively-close': () => {
      this._closed = true;
      const close_handler = this._event_listeners['close'];
      if (close_handler) close_handler();
    },
    'yielding-start-request': (field_name, yielding_handler_parameter, ready_yielding) => {
      this._yielding_handlers[field_name](yielding_handler_parameter, ready_yielding);
    }
  };

  /**
   * @memberof module:WorkerSocket
   * @type {object}
   * @private
   */
  this._worker_socket_functions = {};

  /**
   * @memberof module:WorkerSocket
   * @type {object}
   * @private
   */
  this._yielding_handlers = {};
}

/**
 * @callback module:WorkerSocket~callback_of_close
 * @param {error} error
 */
/**
 * @memberof module:WorkerSocket
 * @param {module:WorkerSocket~callback_of_close} callback
 * @description Close WorkerSocket.
 */
WorkerSocket.prototype.close = function(callback) {
  this._event_listeners['initiative-close'](callback);
}

/**
 * @callback module:WorkerSocket~callback_of_on
 * @description Parameters depends.
 */
/**
 * @memberof module:WorkerSocket
 * @param {string} event_name
 * @param {module:WorkerSocket~callback_of_on} callback
 * @description WorkerSocket events registeration.
 */
WorkerSocket.prototype.on = function(event_name, listener) {
  this._event_listeners[event_name] = listener;
}

/**
 * @callback module:WorkerSocket~ready_yielding_callback
 * @param {error} error
 * @param {noxerve_supported_data_type} data
 * @param {boolean} end_of_file
 */
/**
 * @callback module:WorkerSocket~yielding_handler
 * @param {noxerve_supported_data_type} yielding_handler_parameter
 * @param {module:WorkerSocket~ready_yielding_callback} ready_yielding
 */
/**
 * @memberof module:WorkerSocket
 * @param {string} field_name
 * @param {module:WorkerSocket~yielding_handler} yielding_handler
 * @description WorkerSocket yield handler registeration. Handle yield from
 * another worker to a specific field.
 */
WorkerSocket.prototype.handleYielding = function(field_name, yielding_handler) {
  this._yielding_handlers[field_name] = yielding_handler;
  this._event_listeners['yielding-handle'](field_name);

}

/**
 * @callback module:WorkerSocket~worker_socket_function
 * @param {noxerve_supported_data_type} worker_socket_function_parameter
 * @param {function} return_data
 * @param {function} yield_data
 */
/**
 * @memberof module:WorkerSocket
 * @param {string} worker_socket_function_name
 * @param {module:WorkerSocket~worker_socket_function} worker_socket_function
 * @description WorkerSocket worker-socket function registeration. Provide ability to stream data
 * from this worker to another.
 */
WorkerSocket.prototype.define = function(worker_socket_function_name, worker_socket_function) {
  this._worker_socket_functions[worker_socket_function_name] = worker_socket_function;
  this._event_listeners['function-define'](worker_socket_function_name);
}


/**
 * @callback module:WorkerSocket~callback_of_start_yielding
 * @param {error} error
 * @param {noxerve_supported_data_type} yielding_start_callback_parameter
 * @param {function} finish_yield
 * @param {function} yield_data
 */
/**
 * @memberof module:WorkerSocket
 * @param {string} field_name
 * @param {noxerve_supported_data_type} yielding_start_argument
 * @param {module:Service~callback_of_start_yielding} yielding_start_callback
 * @description WorkerSocket startYielding. Provide ability to stream data
 * from this worker to another. Yielded data handled by another worker.
 */
WorkerSocket.prototype.startYielding = function(field_name, yielding_start_argument, yielding_start_callback) {
  this._event_listeners['yielding-start'](field_name, yielding_start_argument, yielding_start_callback);
}

/**
 * @callback module:WorkerSocket~callback_of_call
 * @param {error} error
 * @param {noxerve_supported_data_type} worker_socket_function_return_data
 * @param {boolean} is_end_of_file
 */
/**
 * @memberof module:WorkerSocket
 * @param {string} worker_socket_function_name
 * @param {noxerve_supported_data_type} worker_socket_function_argument
 * @param {module:Service~callback_of_call} worker_socket_function_callback
 * @description WorkerSocket call. Call worker-socket function defined from another worker.
 */
WorkerSocket.prototype.call = function(worker_socket_function_name, worker_socket_function_argument, worker_socket_function_callback) {
  this._event_listeners['function-call'](worker_socket_function_name, worker_socket_function_argument, worker_socket_function_callback);
}

/**
 * @memberof module:WorkerSocket
 * @param {string} event_name
 * @description WorkerSocket events emitter. For internal uses.
 */
WorkerSocket.prototype.emitEventListener = function(event_name, ...params) {
  return this._event_listeners[event_name].apply(null, params);
}

module.exports = WorkerSocket;

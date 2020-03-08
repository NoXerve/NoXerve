module.exports = {
  'ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE': class ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE extends Error {
    constructor(message, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_CONNECTOR_CREATE': class ERR_NOXERVEAGENT_NODE_CONNECTOR_CREATE extends Error {
    constructor(message, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_CONNECTOR_CREATE);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_CONNECTOR_CREATE';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_INTERFACE_NOT_EXISTS': class ERR_NOXERVEAGENT_NODE_INTERFACE_NOT_EXISTS extends Error {
    constructor(message, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_INTERFACE_NOT_EXISTS);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_INTERFACE_NOT_EXISTS';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE': class ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE extends Error {
    constructor(message, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE';
      this.message = message;
    }
  }
};

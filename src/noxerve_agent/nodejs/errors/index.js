module.exports = {
  'ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE': class ERR_NOXERVEAGENT_NODE_INTERFACE_CREATE extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
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
      // Pass remaining parameters (including vendor specific ones) to parent constructor
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
      // Pass remaining parameters (including vendor specific ones) to parent constructor
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
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_CONNECTOR_NOT_AVALIABLE';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_INTERFACE_START': class ERR_NOXERVEAGENT_NODE_INTERFACE_START extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_INTERFACE_START);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_INTERFACE_START';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_VIRTUALNET': class ERR_NOXERVEAGENT_NODE_VIRTUALNET extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_VIRTUALNET);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_VIRTUALNET';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_TUNNEL_GET_EMITTER': class ERR_NOXERVEAGENT_NODE_TUNNEL_GET_EMITTER extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_TUNNEL_GET_EMITTER);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_TUNNEL_GET_EMITTER';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_TUNNEL_SETTINGS': class ERR_NOXERVEAGENT_NODE_TUNNEL_SETTINGS extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_TUNNEL_SETTINGS);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_TUNNEL_SETTINGS';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NODE_CREATE_TUNNEL': class ERR_NOXERVEAGENT_NODE_CREATE_TUNNEL extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NODE_CREATE_TUNNEL);
      }

      this.name = 'ERR_NOXERVEAGENT_NODE_CREATE_TUNNEL';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_NSDT_CREATE_CALLABLE_STRUCTURE': class ERR_NOXERVEAGENT_NSDT_CREATE_CALLABLE_STRUCTURE extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_NSDT_CREATE_CALLABLE_STRUCTURE);
      }

      this.name = 'ERR_NOXERVEAGENT_NSDT_CREATE_CALLABLE_STRUCTURE';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED': class ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED);
      }

      this.name = 'ERR_NOXERVEAGENT_PROTOCOL_NSDT_EMBEDDED';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_PROTOCOL': class ERR_NOXERVEAGENT_PROTOCOL extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_PROTOCOL);
      }

      this.name = 'ERR_NOXERVEAGENT_PROTOCOL';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY': class ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY);
      }

      this.name = 'ERR_NOXERVEAGENT_PROTOCOL_ACTIVITY';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_PROTOCOL_SERVICE': class ERR_NOXERVEAGENT_PROTOCOL_SERVICE extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_PROTOCOL_SERVICE);
      }

      this.name = 'ERR_NOXERVEAGENT_PROTOCOL_SERVICE';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_PROTOCOL_WORKER': class ERR_NOXERVEAGENT_PROTOCOL_WORKER extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_PROTOCOL_WORKER);
      }

      this.name = 'ERR_NOXERVEAGENT_PROTOCOL_WORKER';
      this.message = message;
    }
  },
  'ERR_NOXERVEAGENT_WORKER': class ERR_NOXERVEAGENT_WORKER extends Error {
    constructor(message, ...params) {
      // Pass remaining parameters (including vendor specific ones) to parent constructor
      super(...params)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ERR_NOXERVEAGENT_WORKER);
      }

      this.name = 'ERR_NOXERVEAGENT_WORKER';
      this.message = message;
    }
  }
};

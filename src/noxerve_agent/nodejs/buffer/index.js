/**
 * @file NoXerveAgent buffer index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

/**
 * @module Buffer
 * @description This module improves the javascript code compatibility between native
 * javascript environment and nodejs evironment.
 */

module.exports = {
  from: (...args) => {
    return Buffer.from.apply(null, args);
  },

  encodeUInt32BE: (integer) => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32BE(integer, 0);
    return buf;
  },

  decodeUInt32BE: (buf) => {
    return buf.readUInt32BE(0);
  },

  alloc: (...args) => {
    return Buffer.alloc.apply(null, args);
  },

  encode: (...args) => {
    return Buffer.from.apply(null, args);
  },

  decode: (...args) => {
    return args[0].toString('utf8');
  },

  concat: (...args) => {
    return Buffer.concat.apply(null, args);
  },

  isBuffer: (...args) => {
    return Buffer.isBuffer.apply(null, args);
  }
};

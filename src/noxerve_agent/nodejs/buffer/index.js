/**
 * @file NoXerveAgent buffer index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
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

  alloc: (...args) => {
    return Buffer.alloc.apply(null, args);
  },

  encode: (...args) => {
    return Buffer.from.apply(null, args);
  },

  decode: (...args) => {
    return args[0].toString();
  },

  concat: (...args) => {
    return Buffer.concat.apply(null, args);
  },

  isBuffer: (...args) => {
    return Buffer.isBuffer.apply(null, args);
  }
};

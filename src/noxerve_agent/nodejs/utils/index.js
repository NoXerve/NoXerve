/**
 * @file NoXerveAgent utils index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 * @description Utils provides handful tools that can be commonly used.
 */

let Crypto = require('crypto');

// Crypto level random bytes.
module.exports.random8bytes = function() {
  return Crypto.randomBytes(8);
}

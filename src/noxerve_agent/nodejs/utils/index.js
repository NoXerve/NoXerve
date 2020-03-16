/**
 * @file NoXerveAgent utils index file. [index.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 * @description Utils provides handful tools that can be commonly used.
 */

let Crypto = require('crypto');

// Crypto level random bytes.
module.exports.random8Bytes = function() {
  return Crypto.randomBytes(8);
}

// Crypto level random bytes.
module.exports.random4Bytes = function() {
  return Crypto.randomBytes(4);
}

module.exports.shuffleArray = function(array) {
  let current_index = array.length,
    temporary_value, random_index;

  // While there remain elements to shuffle...
  while (0 !== current_index) {

    // Pick a remaining element...
    random_index = Math.floor(Math.random() * current_index);
    current_index -= 1;

    // And swap it with the current element.
    temporary_value = array[current_index];
    array[current_index] = array[random_index];
    array[random_index] = temporary_value;
  }

  return array;
}

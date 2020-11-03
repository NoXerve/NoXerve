/**
 * @file NoXerveAgent utils index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 * @description Utils provides handful tools that can be commonly used.
 */

let Crypto = require('crypto');

// Crypto level random bytes.
module.exports.hash4BytesMd5 = function(bytes) {
  const hash_of_the_string = Crypto.createHash('md5');
  hash_of_the_string.update(bytes);
  return hash_of_the_string.digest().slice(0, 4);
}

// Crypto level random bytes.
module.exports.hash8BytesMd5 = function(bytes) {
  const hash_of_the_string = Crypto.createHash('md5');
  hash_of_the_string.update(bytes);
  return hash_of_the_string.digest().slice(0, 8);
}

// Crypto level random bytes.
module.exports.hash16BytesMd5 = function(bytes) {
  const hash_of_the_string = Crypto.createHash('md5');
  hash_of_the_string.update(bytes);
  return hash_of_the_string.digest().slice(0, 16);
}

// Crypto level random bytes.
module.exports.hash32BytesMd5 = function(bytes) {
  const hash_of_the_string = Crypto.createHash('md5');
  hash_of_the_string.update(bytes);
  return hash_of_the_string.digest().slice(0, 32);
}

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

module.exports.areBuffersEqual = function (bufA, bufB) {
    let len = bufA.length;
    if (len !== bufB.length) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if (bufA[i] !== bufB[i]) {
            return false;
        }
    }
    return true;
}

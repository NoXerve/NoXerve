/**
 * @file NoXerveAgent utils index file. [index.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2021 nooxy. All Rights Reserved.
 * @description Utils provides handful tools that can be commonly used.
 */

let Crypto = require('crypto');

module.exports.generateUniqueIntegerListInRangeRandomly = function(begin_int, end_int, list_length) {
  let list = [];
  while(list.length < list_length){
      let r = Math.floor(Math.random() * (end_int - begin_int + 1)) + begin_int;
      if(list.indexOf(r) === -1) list.push(r);
  }
  return list;
}

module.exports.hash4BytesMd5 = function(bytes) {
  const hash = Crypto.createHash('md5');
  hash.update(bytes);
  return hash.digest().slice(0, 4);
}

module.exports.hash8BytesMd5 = function(bytes) {
  const hash = Crypto.createHash('md5');
  hash.update(bytes);
  return hash.digest().slice(0, 8);
}

module.exports.hash16BytesMd5 = function(bytes) {
  const hash = Crypto.createHash('md5');
  hash.update(bytes);
  return hash.digest().slice(0, 16);
}

module.exports.hash32BytesMd5 = function(bytes) {
  const hash = Crypto.createHash('md5');
  hash.update(bytes);
  return hash.digest().slice(0, 32);
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

var genOp, randomInt, randomWord, type, _ref;

_ref = require('ot-fuzzer'), randomInt = _ref.randomInt, randomWord = _ref.randomWord;

type = require('../lib').type;

module.exports = genOp = function(docStr) {
  var addDelete, addInsert, chance, consume, expectedDoc, initial, op;
  initial = docStr;
  op = [];
  expectedDoc = '';
  consume = function(len) {
    expectedDoc += docStr.slice(0, len);
    return docStr = docStr.slice(len);
  };
  addInsert = function() {
    var skip, word;
    skip = randomInt(Math.min(docStr.length, 5));
    word = randomWord() + ' ';
    op.push(skip);
    consume(skip);
    op.push(word);
    return expectedDoc += word;
  };
  addDelete = function() {
    var length, skip;
    skip = randomInt(Math.min(docStr.length, 5));
    op.push(skip);
    consume(skip);
    length = randomInt(Math.min(docStr.length, 10));
    op.push({
      d: length
    });
    return docStr = docStr.slice(length);
  };
  while (docStr.length > 0) {
    chance = initial.length > 100 ? 3 : 2;
    switch (randomInt(chance)) {
      case 0:
        addInsert();
        break;
      case 1:
      case 2:
        addDelete();
    }
    if (randomInt(7) === 0) {
      break;
    }
  }
  if (randomInt(10) === 0) {
    addInsert();
  }
  expectedDoc += docStr;
  return [type.normalize(op), expectedDoc];
};
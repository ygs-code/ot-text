var assert, fs, fuzzer, genOp, readOp, type;

fs = require("fs");

assert = require("assert");

fuzzer = require("ot-fuzzer");

type = require("../lib").type;

genOp = require("./genOp");

readOp = function (file) {
  var c, op;
  op = (function () {
    var _i, _len, _ref, _results;
    _ref = JSON.parse(file.shift());
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      c = _ref[_i];
      if (typeof c === "number") {
        _results.push(c);
      } else if (c.i != null) {
        _results.push(c.i);
      } else {
        _results.push({
          d: c.d.length,
        });
      }
    }
    return _results;
  })();
  console.log('op===',op)
  return type.normalize(op);
};

/*
assert.strictEqual()
   严格相等测试，由全等运算符确定（===）。

assert.deepEqual(actual, expected[, message])
   深度比较 actual 和 expected 参数，使用比较运算符（==）比较原始值。

assert.equal(actual, expected[, message])
  使用相等运算符（==）测试 actual 参数与 expected 参数是否相等（通俗解释equal方法接受三个参数，第一个参数是实际值，第二个是预期值，第三个是错误的提示信息。）。
*/
// console.log(type.create('oh hi'))

// console.log(type.normalize([
//         {
//           d: 0,
//         },
//       ]))

//  return

describe("text", function () {
  describe("text-transform-tests.json", function () {
    // it("should transform correctly", function () {
    //   var expected, op, otherOp, result, side, testData, _results;
    //   testData = fs
    //     .readFileSync(__dirname + "/text-transform-tests.json")
    //     .toString()
    //     .split("\n");
    //   _results = [];
    //   console.log('testData=',testData.length)
    //   console.log('testData.length=',testData.length)
    //   while (testData.length >= 4) {
    //     op = readOp(testData);
    //     otherOp = readOp(testData);
    //     side = testData.shift();
    //     expected = readOp(testData);
    //     result = type.transform(op, otherOp, side);
    //     _results.push(assert.deepEqual(result, expected));
    //   }
    //   console.log('_results=',_results)
    //   return _results;
    // });
    it("should compose without crashing", function () {
      var op1, op2, result, testData, _results;
      testData = fs
        .readFileSync(__dirname + "/text-transform-tests.json")
        .toString()
        .split("\n");
      _results = [];

      while (testData.length >= 4) {
        testData.shift();
        op1 = readOp(testData);
        console.log('testData=',testData)
        // console.log('op1=',op1)
        testData.shift();
        op2 = readOp(testData);
        // console.log('testData=',testData)
        // console.log('op2=',op2)
        // 合并
        _results.push((result = type.compose(op1, op2)));
      }

      // op1 = readOp(`[1,{"d":"abcde"},14]`);
      // op2 = readOp(`[7,{"d":"fg"},11]`);
      // result = type.compose(op1, op2)
      // console.log('result========',result)

      console.log("_results=====", _results);
      return _results;
    });
  });
  //创建文本
  // describe('#create()', function() {
  //   it('should return an empty string when called with no arguments', function() {
  //     return assert.strictEqual('', type.create());
  //   });
  //   it('should return any string thats passed in', function() {
  //     assert.strictEqual('', type.create(''));
  //     return assert.strictEqual('oh hi', type.create('oh hi'));
  //   });
  //   return it('throws when something other than a string is passed in', function() {
  //     return assert.throws((function() {
  //       return type.create(123);
  //     }), /must be a string/);
  //   });
  // });
  // it("should normalize sanely", function () {
  //   assert.deepEqual([], type.normalize([0]));
  //   assert.deepEqual([], type.normalize([""]));
  // assert.deepEqual(
  //   [],
  //   type.normalize([
  //     {
  //       d: 0,
  //     },
  //   ])
  // );
  // assert.deepEqual(
  //   [
  //     {
  //       d: 2,
  //     },
  //   ],
  //   type.normalize([
  //     {
  //       d: 2,
  //     },
  //   ])
  // );
  // assert.deepEqual([], type.normalize([1, 1]));
  // assert.deepEqual([], type.normalize([2, 0]));
  // assert.deepEqual([2, "hi"], type.normalize([1, 1, "hi"]));
  // assert.deepEqual(
  //   [
  //     {
  //       d: 2,
  //     },
  //     "hi",
  //   ],
  //   type.normalize([
  //     {
  //       d: 1,
  //     },
  //     {
  //       d: 1,
  //     },
  //     "hi",
  //   ])
  // );
  // assert.deepEqual(["a"], type.normalize(["a", 100]));
  // assert.deepEqual(["ab"], type.normalize(["a", "b"]));
  // assert.deepEqual(["ab"], type.normalize(["ab", ""]));
  // assert.deepEqual(["ab"], type.normalize([0, "a", 0, "b", 0]));
  // return assert.deepEqual(["a", 1, "b"], type.normalize(["a", 1, "b"]));
  // });
  // describe("#selectionEq", function () {
  //   it("just does equality on plain numbers", function () {
  //     console.log("type.selectionEq(5, 5)====", type.selectionEq(5, 5));
  //     /*
  //       c1 是个数组
  //       c2 也是个数组
  //       c1 c2 也可以是相同的文本 数字
  //       如果c1和c2数组长度大于或者等于2
  //       并且前两项是一样的那么 c1就等于c1[0]  c2就等于c2[0]
  //       如果是 c1就等于c1[0]  c2就等于c2[0] 那么数组就被第一项替换掉

  //       或者  c1[0] === c2[0] && c1[1] == c2[1]
  //    */

  //     assert(type.selectionEq(5, 5));
  //     assert(type.selectionEq(0, 0));
  //     assert.equal(false, type.selectionEq(0, 1));
  //     return assert.equal(false, type.selectionEq(5, 1));
  //   });
  //   it("compares pairs correctly", function () {
  //     assert(type.selectionEq([1, 2], [1, 2]));
  //     assert(type.selectionEq([2, 2], [2, 2]));
  //     assert(type.selectionEq([0, 0], [0, 0]));
  //     assert(type.selectionEq([0, 1], [0, 1]));
  //     assert(type.selectionEq([1, 0], [1, 0]));
  //     assert.equal(false, type.selectionEq([1, 2], [1, 0]));
  //     assert.equal(false, type.selectionEq([0, 2], [0, 1]));
  //     assert.equal(false, type.selectionEq([1, 0], [5, 0]));
  //     return assert.equal(false, type.selectionEq([1, 1], [5, 5]));
  //   });
  //   return it("works with array vs number", function () {
  //     assert(type.selectionEq(0, [0, 0]));
  //     assert(type.selectionEq(1, [1, 1]));
  //     assert(type.selectionEq([0, 0], 0));
  //     assert(type.selectionEq([1, 1], 1));
  //     assert.equal(false, type.selectionEq(1, [1, 0]));
  //     assert.equal(false, type.selectionEq(0, [0, 1]));
  //     assert.equal(false, type.selectionEq([1, 2], 1));
  //     return assert.equal(false, type.selectionEq([0, 2], 0));
  //   });
  // });
  // describe('#transformSelection()', function() {
  //   var del, ins, op, tc;
  //   ins = [10, "oh hi"];
  //   del = [
  //     25, {
  //       d: 20
  //     }
  //   ];
  //   op = [
  //     10, 'oh hi', 10, {
  //       d: 20
  //     }
  //   ];
  //   tc = function(op, isOwn, cursor, expected) {
  //     console.log('op=',op)
  //     console.log('isOwn=',isOwn)
  //     console.log('cursor=',cursor)
  //     console.log('expected=',expected)
  //     assert(type.selectionEq(expected, type.transformSelection(cursor, op, isOwn)));
  //     return assert(type.selectionEq(expected, type.transformSelection([cursor, cursor], op, isOwn)));
  //   };
  //   it("shouldn't move a cursor at the start of the inserted text", function() {


  //     return tc(op, false, 10, 10);
  //   });
  //   // it("move a cursor at the start of the inserted text if its yours", function() {
  //   //   return tc(ins, true, 10, 15);
  //   // });
  //   it('should move a character inside a deleted region to the start of the region', function() {
  //     tc(del, false, 25, 25);
  //     tc(del, false, 35, 25);
  //     tc(del, false, 45, 25);
  //     tc(del, true, 25, 25);
  //     tc(del, true, 35, 25);
  //     return tc(del, true, 45, 25);
  //   });
    // it("shouldn't effect cursors before the deleted region", function() {
    //   return tc(del, false, 10, 10);
    // });
    // it("pulls back cursors past the end of the deleted region", function() {
    //   return tc(del, false, 55, 35);
    // });
    // it("teleports your cursor to the end of the last insert or the delete", function() {
    //   tc(ins, true, 0, 15);
    //   tc(ins, true, 100, 15);
    //   tc(del, true, 0, 25);
    //   return tc(del, true, 100, 25);
    // });
    // return it("works with more complicated ops", function() {
    //   tc(op, false, 0, 0);
    //   tc(op, false, 100, 85);
    //   tc(op, false, 10, 10);
    //   tc(op, false, 11, 16);
    //   tc(op, false, 20, 25);
    //   tc(op, false, 30, 25);
    //   tc(op, false, 40, 25);
    //   return tc(op, false, 41, 26);
    // });
  // });
  // return describe('randomizer', function() {
  //   return it('passes', function() {
  //     this.timeout(10000);
  //     this.slow(1500);
  //     return fuzzer(type, genOp);
  //   });
  // });
});

require("./api")(type, genOp);

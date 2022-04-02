/*
 * @Date: 2022-04-02 10:06:11
 * @Author: Yao guan shou
 * @LastEditors: Yao guan shou
 * @LastEditTime: 2022-04-02 13:56:27
 * @FilePath: /ot-text/test/api.js
 * @Description: 
 */
var assert, randomInt, randomReal, randomWord, _ref;

// 断言库
assert = require('assert');
// 生成随机ot数据的库
_ref = require('../modules/ot-fuzzer'),
 randomInt = _ref.randomInt, 
 randomReal = _ref.randomReal,
  randomWord = _ref.randomWord;

module.exports = function(type, genOp) {
  return describe("text api for '" + type.name + "'", function() {
    if (!type.api.provides.text) {
      throw 'Type does not claim to provide the text api';
    }
    beforeEach(function() {
      var getSnapshot, submitOp;
      this.snapshot = type.create();
      getSnapshot = (function(_this) {
        return function() {
          return _this.snapshot;
        };
      })(this);
      submitOp = (function(_this) {
        return function(op, callback) {
          op = type.normalize(op);
          _this.snapshot = type.apply(_this.snapshot, op);
          return typeof callback === "function" ? callback() : void 0;
        };
      })(this);
      this.ctx = type.api(getSnapshot, submitOp);
      return this.apply = function(op) {
        var _base;
        if (typeof (_base = this.ctx)._beforeOp === "function") {
          _base._beforeOp(op);
        }
        submitOp(op);
        return this.ctx._onOp(op);
      };
    });
    it('has no length when empty', function() {
      assert.strictEqual(this.ctx.get(), '');
      return assert.strictEqual(this.ctx.getLength(), 0);
    });
    it('works with simple inserts and removes', function() {
      this.ctx.insert(0, 'hi');
      assert.strictEqual(this.ctx.get(), 'hi');
      assert.strictEqual(this.ctx.getLength(), 2);
      this.ctx.insert(2, ' mum');
      assert.strictEqual(this.ctx.get(), 'hi mum');
      assert.strictEqual(this.ctx.getLength(), 6);
      this.ctx.remove(0, 3);
      assert.strictEqual(this.ctx.get(), 'mum');
      return assert.strictEqual(this.ctx.getLength(), 3);
    });
    it('gets edited correctly', function() {
      var content, i, len, pos, str, _i, _results;
      content = '';
      _results = [];
      for (i = _i = 1; _i <= 1000; i = ++_i) {
        if (content.length === 0 || randomReal() > 0.5) {
          pos = randomInt(content.length + 1);
          str = randomWord() + ' ';
          this.ctx.insert(pos, str);
          content = content.slice(0, pos) + str + content.slice(pos);
        } else {
          pos = randomInt(content.length);
          len = Math.min(randomInt(4), content.length - pos);
          this.ctx.remove(pos, len);
          content = content.slice(0, pos) + content.slice(pos + len);
        }
        assert.strictEqual(this.ctx.get(), content);
        _results.push(assert.strictEqual(this.ctx.getLength(), content.length));
      }
      return _results;
    });
    return it('emits events correctly', function() {
      var contents, i, newDoc, op, _i, _ref1, _results;
      contents = '';
      this.ctx.onInsert = function(pos, text) {
        return contents = contents.slice(0, pos) + text + contents.slice(pos);
      };
      this.ctx.onRemove = function(pos, len) {
        return contents = contents.slice(0, pos) + contents.slice(pos + len);
      };
      _results = [];
      for (i = _i = 1; _i <= 1000; i = ++_i) {
        _ref1 = genOp(this.snapshot), op = _ref1[0], newDoc = _ref1[1];
        this.apply(op);
        _results.push(assert.strictEqual(this.ctx.get(), contents));
      }
      return _results;
    });
  });
};
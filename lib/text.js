/* Text OT!
 *
 * This is an OT implementation for text. It is the standard implementation of
 * text used by ShareJS.
 *
 * This type is composable but non-invertable. Its similar to ShareJS's old
 * text-composable type, but its not invertable and its very similar to the
 * text-tp2 implementation but it doesn't support tombstones or purging.
 *
 * Ops are lists of components which iterate over the document.
 * Components are either:
 *   A number N: Skip N characters in the original document
 *   "str"     : Insert "str" at the current position in the document
 *   {d:N}     : Delete N characters at the current position in the document
 *
 * Eg: [3, 'hi', 5, {d:8}]
 *
 * The operation does not have to skip the last characters in the document.
 *
 * Snapshots are strings.
 *
 * Cursors are either a single number (which is the cursor position) or a pair of
 * [anchor, focus] (aka [start, end]). Be aware that end can be before start.
 */

/** @module text */

exports.name = "text";
exports.uri = "http://sharejs.org/types/textv1";

/** Create a new text snapshot.
 *
 * @param {string} initial - initial snapshot data. Optional. Defaults to ''.
 */
exports.create = (initial) => {
  if (initial != null && typeof initial !== "string") {
    throw Error("Initial data must be a string");
  }
  return initial || "";
};

/** Check the operation is valid. Throws if not valid. */
// 检查操作是否有效。抛出无效。
const checkOp = function (op) {
  if (!Array.isArray(op)) throw Error("Op must be an array of components");

  let last = null;
  for (let i = 0; i < op.length; i++) {
    const c = op[i];
    //
    switch (typeof c) {
      case "object":
        // The only valid objects are {d:X} for +ive values of X.
        //对于X的+ive值，唯一有效的对象是{d:X}。
        if (!(typeof c.d === "number" && c.d > 0))
          throw Error("Object components must be deletes of size > 0");
        break;
      case "string":
        // Strings are inserts.
        if (!(c.length > 0)) throw Error("Inserts cannot be empty");
        break;
      case "number":
        // Numbers must be skips. They have to be +ive numbers.
        //数字必须是跳过。它们必须是+ive数。
        if (!(c > 0)) throw Error("Skip components must be >0");
        if (typeof last === "number")
          throw Error("Adjacent skip components should be combined");
        break;
    }
    last = c;
  }

  if (typeof last === "number") throw Error("Op has a trailing skip");
};

/** Check that the given selection range is valid. */
// 检查给定的选择范围是否有效。
const checkSelection = (selection) => {
  // This may throw from simply inspecting selection[0] / selection[1]. Thats
  // sort of ok, though it'll generate the wrong message.
  if (
    typeof selection !== "number" &&
    (typeof selection[0] !== "number" || typeof selection[1] !== "number")
  ) {
    throw Error("Invalid selection");
  }
};

/** Make a function that appends to the given operation. */
// 创建一个附加到给定操作的函数。
const makeAppend = (op) => (component) => {
  if (!component || component.d === 0) {
    // The component is a no-op. Ignore!
    // 组件是无操作的。忽略!
  } else if (op.length === 0) {
    op.push(component);
  } else if (typeof component === typeof op[op.length - 1]) {
    if (typeof component === "object") {
      op[op.length - 1].d += component.d;
    } else {
      op[op.length - 1] += component;
    }
  } else {
    op.push(component);
  }
};

/** Makes and returns utility functions take and peek. */
// 创建并返回实用函数take和peek。
const makeTake = function (op) {
  // The index of the next component to take
  let idx = 0;
  // The offset into the component
  let offset = 0;

  // Take up to length n from the front of op. If n is -1, take the entire next
  // op component. If indivisableField == 'd', delete components won't be separated.
  // If indivisableField == 'i', insert components won't be separated.
  const take = (n, indivisableField) => {
    // We're at the end of the operation. The op has skips, forever. Infinity
    // might make more sense than null here.
    if (idx === op.length) return n === -1 ? null : n;

    const c = op[idx];
    let part;
    if (typeof c === "number") {
      // Skip
      if (n === -1 || c - offset <= n) {
        part = c - offset;
        ++idx;
        offset = 0;
        return part;
      } else {
        offset += n;
        return n;
      }
    } else if (typeof c === "string") {
      // Insert
      if (n === -1 || indivisableField === "i" || c.length - offset <= n) {
        part = c.slice(offset);
        ++idx;
        offset = 0;
        return part;
      } else {
        part = c.slice(offset, offset + n);
        offset += n;
        return part;
      }
    } else {
      // Delete
      if (n === -1 || indivisableField === "d" || c.d - offset <= n) {
        part = { d: c.d - offset };
        ++idx;
        offset = 0;
        return part;
      } else {
        offset += n;
        return { d: n };
      }
    }
  };

  // Peek at the next op that will be returned.
  const peekType = () => op[idx];

  return [take, peekType];
};

/** Get the length of a component */
const componentLength = (c) => (typeof c === "number" ? c : c.length || c.d);

/** Trim any excess skips from the end of an operation.
 *
 * There should only be at most one, because the operation was made with append.
 */
const trim = (op) => {
  if (op.length > 0 && typeof op[op.length - 1] === "number") {
    op.pop();
  }
  return op;
};

exports.normalize = function (op) {
  const newOp = [];
  const append = makeAppend(newOp);
  for (let i = 0; i < op.length; i++) append(op[i]);
  return trim(newOp);
};

// 对文档快照应用操作
/** Apply an operation to a document snapshot */
exports.apply = function (str, op) {
  if (typeof str !== "string") {
    throw Error("Snapshot should be a string");
  }
  checkOp(op);

  // We'll gather the new document here and join at the end.
  const newDoc = [];

  for (let i = 0; i < op.length; i++) {
    const component = op[i];
    switch (typeof component) {
      case "number":
        if (component > str.length)
          throw Error("The op is too long for this document");

        newDoc.push(str.slice(0, component));
        // This might be slow for big strings. Consider storing the offset in
        // str instead of rewriting it each time.
        str = str.slice(component);
        break;
      case "string":
        newDoc.push(component);
        break;
      case "object":
        str = str.slice(component.d);
        break;
    }
  }

  return newDoc.join("") + str;
};

/** Transform op by otherOp. 用otherOp转换op。
 *
 * @param op - The operation to transform
 * @param otherOp - Operation to transform it by
 * @param side - Either 'left' or 'right'
 */
exports.transform = function (op, otherOp, side) {
  if (side !== "left" && side !== "right") {
    throw Error("side (" + side + ") must be 'left' or 'right'");
  }

  checkOp(op);
  checkOp(otherOp);

  const newOp = [];

  const append = makeAppend(newOp);
  const [take, peek] = makeTake(op);

  for (let i = 0; i < otherOp.length; i++) {
    const component = otherOp[i];

    let length, chunk;
    switch (typeof component) {
      case "number": // Skip
        length = component;
        while (length > 0) {
          chunk = take(length, "i");
          append(chunk);
          if (typeof chunk !== "string") {
            length -= componentLength(chunk);
          }
        }
        break;

      case "string": // Insert
        if (side === "left") {
          // The left insert should go first.
          if (typeof peek() === "string") {
            append(take(-1));
          }
        }

        // Otherwise skip the inserted text.
        append(component.length);
        break;

      case "object": // Delete
        length = component.d;
        while (length > 0) {
          chunk = take(length, "i");
          switch (typeof chunk) {
            case "number":
              length -= chunk;
              break;
            case "string":
              append(chunk);
              break;
            case "object":
              // The delete is unnecessary now - the text has already been deleted.
              length -= chunk.d;
          }
        }
        break;
    }
  }

  // Append any extra data in op1.
  let c;
  while ((c = take(-1))) append(c);

  return trim(newOp);
};

/** Compose op1 and op2 together and return the result */
exports.compose = function (op1, op2) {
  checkOp(op1);
  checkOp(op2);

  const result = [];
  const append = makeAppend(result);
  const take = makeTake(op1)[0];

  for (let i = 0; i < op2.length; i++) {
    const component = op2[i];
    let length, chunk;
    switch (typeof component) {
      case "number": // Skip
        length = component;
        while (length > 0) {
          chunk = take(length, "d");
          append(chunk);
          if (typeof chunk !== "object") {
            length -= componentLength(chunk);
          }
        }
        break;

      case "string": // Insert
        append(component);
        break;

      case "object": // Delete
        length = component.d;

        while (length > 0) {
          chunk = take(length, "d");

          switch (typeof chunk) {
            case "number":
              append({ d: chunk });
              length -= chunk;
              break;
            case "string":
              length -= chunk.length;
              break;
            case "object":
              append(chunk);
          }
        }
        break;
    }
  }

  let c;
  while ((c = take(-1))) append(c);

  return trim(result);
};

const transformPosition = (cursor, op) => {
  let pos = 0;
  for (let i = 0; i < op.length; i++) {
    const c = op[i];
    if (cursor <= pos) break;

    // I could actually use the op_iter stuff above - but I think its simpler
    // like this.
    //我实际上可以使用op_iter上面的东西-但我认为它更简单
    //这样的。
    switch (typeof c) {
      case "number":
        if (cursor <= pos + c) return cursor;
        pos += c;
        break;

      case "string":
        pos += c.length;
        cursor += c.length;
        break;

      case "object":
        cursor -= Math.min(c.d, cursor - pos);
        break;
    }
  }
  return cursor;
};

exports.transformSelection = function (selection, op, isOwnOp) {
  let pos = 0;
  if (isOwnOp) {
    // Just track the position. We'll teleport the cursor to the end anyway.
    // This works because text ops don't have any trailing skips at the end - so the last
    // component is the last thing.
    //只跟踪位置。我们会把光标传送到终点。
    //这是有效的，因为text ops在结尾没有任何尾随跳跃-所以最后
    //组件是最后的事情。
    for (let i = 0; i < op.length; i++) {
      const c = op[i];
      switch (typeof c) {
        case "number":
          pos += c;
          break;
        case "string":
          pos += c.length;
          break;
        // Just eat deletes.
      }
    }
    return pos;
  } else {
    return typeof selection === "number"
      ? transformPosition(selection, op)
      : [
          transformPosition(selection[0], op),
          transformPosition(selection[1], op),
        ];
  }
};

/*
c1 是个数组
c2 也是个数组
c1 c2 也可以是相同的文本 数字
如果c1和c2数组长度大于或者等于2
并且前两项是一样的那么 c1就等于c1[0]  c2就等于c2[0]
如果是 c1就等于c1[0]  c2就等于c2[0] 那么数组就被第一项替换掉

或者  c1[0] === c2[0] && c1[1] == c2[1]
 
测试用例
  let arr1 = [1, 1];
  let arr2 = [1, 1];
  let arr3 = [1, 2, 4, 234, 76];
  let arr4 = [1, 2,9,1234,64536456,7456,4]
  console.log(selectionEq([], [])); // false
  console.log(selectionEq(5, 5)); // true
  console.log(selectionEq(arr1, arr2)); //true
  console.log(selectionEq(arr3, arr4)); //true
  console.log("arr1=", arr1);
  console.log("arr2=", arr2);
  console.log("arr3=", arr3);
  console.log("arr4=", arr4);
*/
var selectionEq = function (c1, c2) {
  // console.log("c1===========", c1);
  // console.log("c2===========", c2);
  // 前面两项相同
  if (c1[0] != null && c1[0] === c1[1]) {
    c1 = c1[0];
  }
  // 前面两项相同
  if (c2[0] != null && c2[0] === c2[1]) {
    c2 = c2[0];
  }
  return (
    c1 === c2 ||
    // 或者  c1[0] === c2[0] && c1[1] == c2[1]
    (c1[0] != null && c2[0] != null && c1[0] === c2[0] && c1[1] == c2[1])
  );
};

exports.selectionEq = selectionEq;
// console.log(selectionEq(5, 5)); // false

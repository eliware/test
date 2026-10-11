import {
  collectBalancedNumericTreeRange,
  collectBalancedNumericTreeValues,
} from "./collect-balanced-numeric-tree-values.mjs";
import {
  insertBalancedNumericTreeNode,
  removeBalancedNumericTreeMinimum,
} from "./mutate-balanced-numeric-tree.mjs";
import {
  rebalanceBalancedNumericTreeNode,
  sizeBalancedNumericTreeNode,
} from "./balance-numeric-tree-node.mjs";

export function createBalancedNumericTree() {
  let root = null;
  function insert(value) {
    assertFiniteNumber(value, "insert");
    root = insertBalancedNumericTreeNode(root, value, rebalanceBalancedNumericTreeNode);
  }
  function removeMinimum() {
    if (root) root = removeBalancedNumericTreeMinimum(root, rebalanceBalancedNumericTreeNode);
  }
  function minimum() {
    let node = root;
    while (node?.left) node = node.left;
    return node?.value;
  }
  function lowerBound(value) {
    assertFiniteNumber(value, "lowerBound");
    let node = root;
    // codescope ignore this because the initial size is the insertion rank when no node meets the bound.
    let result = sizeBalancedNumericTreeNode(root);
    let offset = 0;
    while (node) {
      if (node.value >= value) {
        result = offset + sizeBalancedNumericTreeNode(node.left);
        node = node.left;
      } else {
        offset += sizeBalancedNumericTreeNode(node.left) + 1;
        node = node.right;
      }
    }
    return result;
  }
  function values() {
    return collectBalancedNumericTreeValues(root);
  }
  function range(minimum, maximum) {
    assertFiniteNumber(minimum, "range");
    assertFiniteNumber(maximum, "range");
    return collectBalancedNumericTreeRange(root, minimum, maximum);
  }
  return Object.freeze({ insert, removeMinimum, minimum, lowerBound, values, range });
}
function assertFiniteNumber(value, operation) {
  if (!Number.isFinite(value))
    throw new TypeError(`Balanced numeric tree ${operation} values must be finite numbers.`);
}

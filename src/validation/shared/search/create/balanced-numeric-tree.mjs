import collectBalancedNumericTreeRange from "../collect-balanced-numeric-tree-values/collect-balanced-numeric-tree-range.mjs";
import collectBalancedNumericTreeValues from "../collect-balanced-numeric-tree-values.mjs";
import insertBalancedNumericTreeNode from "../mutate-balanced-numeric-tree.mjs";
import removeBalancedNumericTreeMinimum from "../mutate-balanced-numeric-tree/remove-balanced-numeric-tree-minimum.mjs";
import rebalanceBalancedNumericTreeNode from "../balance-numeric-tree-node.mjs";
import sizeBalancedNumericTreeNode from "../balance-numeric-tree-node/size-balanced-numeric-tree-node.mjs";
import assertFiniteTreeNumber from "../validate/finite-number.mjs";
export default function createBalancedNumericTree() {
  let root = null;
  function insert(value) {
    assertFiniteTreeNumber(value, "insert");
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
    assertFiniteTreeNumber(value, "lowerBound");
    let node = root;
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
    assertFiniteTreeNumber(minimum, "range");
    assertFiniteTreeNumber(maximum, "range");
    return collectBalancedNumericTreeRange(root, minimum, maximum);
  }
  return Object.freeze({
    insert,
    removeMinimum,
    minimum,
    lowerBound,
    values,
    range,
  });
}

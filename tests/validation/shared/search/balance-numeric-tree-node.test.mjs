import { expect, test } from "@jest/globals";
import { rebalanceBalancedNumericTreeNode } from "../../../../src/validation/shared/search/balance-numeric-tree-node.mjs";

function node(value, left = null, right = null) {
  return {
    value,
    left,
    right,
    height: Math.max(left?.height ?? 0, right?.height ?? 0) + 1,
    size: (left?.size ?? 0) + (right?.size ?? 0) + 1,
  };
}

test.each([
  ["left-left", node(3, node(2, node(1)))],
  ["right-right", node(1, null, node(2, null, node(3)))],
  ["left-right", node(3, node(1, null, node(2)))],
  ["right-left", node(1, null, node(3, node(2)))],
])("balances the %s case and updates node metadata", (_case, root) => {
  const balanced = rebalanceBalancedNumericTreeNode(root);
  expect(balanced.value).toBe(2);
  expect(balanced.height).toBe(2);
  expect(balanced.size).toBe(3);
});

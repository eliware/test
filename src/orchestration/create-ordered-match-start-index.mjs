import { createBalancedNumericTree } from "./create-balanced-numeric-tree.mjs";

export function createOrderedMatchStartIndex(isActive) {
  const starts = createBalancedNumericTree();

  function insert(start) {
    starts.insert(start);
  }

  function discardInactive() {
    while (starts.minimum() !== undefined && !isActive(starts.minimum())) starts.removeMinimum();
  }

  return Object.freeze({
    insert,
    lowerBound: starts.lowerBound,
    range: starts.range,
    discardInactive,
    get values() {
      return starts.values();
    },
  });
}

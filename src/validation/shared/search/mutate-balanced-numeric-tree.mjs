export function insertBalancedNumericTreeNode(node, value, rebalance) {
  if (!node) return { value, height: 1, size: 1, left: null, right: null };
  const ancestors = [];
  let current = node;
  while (current) {
    if (value === current.value) return node;
    const side = value < current.value ? "left" : "right";
    ancestors.push({ node: current, side });
    current = current[side];
  }
  let subtree = { value, height: 1, size: 1, left: null, right: null };
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const { node: parent, side } = ancestors[index];
    parent[side] = subtree;
    subtree = rebalance(parent);
  }
  return subtree;
}

export function removeBalancedNumericTreeMinimum(node, rebalance) {
  const ancestors = [];
  let current = node;
  while (current.left) {
    ancestors.push(current);
    current = current.left;
  }
  let subtree = current.right;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const parent = ancestors[index];
    parent.left = subtree;
    subtree = rebalance(parent);
  }
  return subtree;
}

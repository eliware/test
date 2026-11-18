function removeBalancedNumericTreeMinimum(node, rebalance) {
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
export default removeBalancedNumericTreeMinimum;

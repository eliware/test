export function rebalanceBalancedNumericTreeNode(node) {
  update(node);
  const balance = height(node.left) - height(node.right);
  if (balance > 1) {
    if (height(node.left.left) < height(node.left.right)) node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (balance < -1) {
    if (height(node.right.right) < height(node.right.left)) node.right = rotateRight(node.right);
    return rotateLeft(node);
  }
  return node;
}

function rotateLeft(node) {
  const pivot = node.right;
  node.right = pivot.left;
  pivot.left = node;
  update(node);
  return update(pivot);
}

function rotateRight(node) {
  const pivot = node.left;
  node.left = pivot.right;
  pivot.right = node;
  update(node);
  return update(pivot);
}

function update(node) {
  node.height = Math.max(height(node.left), height(node.right)) + 1;
  node.size = sizeBalancedNumericTreeNode(node.left) + sizeBalancedNumericTreeNode(node.right) + 1;
  return node;
}

function height(node) {
  return node?.height ?? 0;
}

export function sizeBalancedNumericTreeNode(node) {
  return node?.size ?? 0;
}

export function createBalancedNumericTree() {
  let root = null;

  function insert(value) {
    root = insertNode(root, value);
  }

  function removeMinimum() {
    if (root) root = removeMinimumNode(root);
  }

  function minimum() {
    let node = root;
    while (node?.left) node = node.left;
    return node?.value;
  }

  function lowerBound(value) {
    let node = root;
    let result = size(root);
    let offset = 0;
    while (node) {
      if (node.value >= value) {
        result = offset + size(node.left);
        node = node.left;
      } else {
        offset += size(node.left) + 1;
        node = node.right;
      }
    }
    return result;
  }

  function values() {
    const result = [];
    appendValues(root, result);
    return result;
  }

  return Object.freeze({ insert, removeMinimum, minimum, lowerBound, values });
}

function insertNode(node, value) {
  if (!node) return { value, height: 1, size: 1, left: null, right: null };
  if (value < node.value) node.left = insertNode(node.left, value);
  else if (value > node.value) node.right = insertNode(node.right, value);
  else return node;
  return rebalance(node);
}
function removeMinimumNode(node) {
  if (!node.left) return node.right;
  node.left = removeMinimumNode(node.left);
  return rebalance(node);
}
function rebalance(node) {
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
  node.size = size(node.left) + size(node.right) + 1;
  return node;
}
function appendValues(node, output) {
  if (!node) return;
  appendValues(node.left, output);
  output.push(node.value);
  appendValues(node.right, output);
}
function height(node) {
  return node?.height ?? 0;
}
function size(node) {
  return node?.size ?? 0;
}

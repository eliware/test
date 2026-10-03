export function collectBalancedNumericTreeValues(root) {
  const values = [];
  appendValues(root, values);
  return values;
}

export function collectBalancedNumericTreeRange(root, minimum, maximum) {
  const values = [];
  if (minimum <= maximum) appendRange(root, minimum, maximum, values);
  return values;
}

function appendValues(node, values) {
  if (!node) return;
  appendValues(node.left, values);
  values.push(node.value);
  appendValues(node.right, values);
}

function appendRange(node, minimum, maximum, values) {
  if (!node) return;
  if (node.value > minimum) appendRange(node.left, minimum, maximum, values);
  if (node.value >= minimum && node.value <= maximum) values.push(node.value);
  if (node.value < maximum) appendRange(node.right, minimum, maximum, values);
}

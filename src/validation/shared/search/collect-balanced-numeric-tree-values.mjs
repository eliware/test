export default function collectBalancedNumericTreeValues(root) {
  const values = [];
  appendValues(root, values);
  return values;
}
function appendValues(node, values) {
  if (!node) return;
  appendValues(node.left, values);
  values.push(node.value);
  appendValues(node.right, values);
}

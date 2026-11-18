function collectBalancedNumericTreeRange(root, minimum, maximum) {
  const values = [];
  if (minimum <= maximum) appendRange(root, minimum, maximum, values);
  return values;
}
function appendRange(node, minimum, maximum, values) {
  if (!node) return;
  if (node.value > minimum) appendRange(node.left, minimum, maximum, values);
  if (node.value >= minimum && node.value <= maximum) values.push(node.value);
  if (node.value < maximum) appendRange(node.right, minimum, maximum, values);
}
export default collectBalancedNumericTreeRange;

export function compareRuleIds(left, right) {
  const leftParts = left.split("-")[1].split(".").map(Number);
  const rightParts = right.split("-")[1].split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? -1) - (rightParts[index] ?? -1);
    if (difference !== 0) return difference;
  }
  return left.localeCompare(right);
}

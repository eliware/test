export function validateSiblingSequences(ruleIds) {
  const groups = new Map();
  for (const ruleId of ruleIds) {
    const parts = ruleId.split(".");
    const prefix = parts.slice(0, -1).join(".");
    groups.set(prefix, [...(groups.get(prefix) ?? []), parts.at(-1)]);
  }
  const errors = [];
  for (const [prefix, numbers] of groups) {
    numbers.sort((left, right) => {
      const difference = BigInt(left) - BigInt(right);
      return difference < 0n ? -1 : difference > 0n ? 1 : 0;
    });
    if (numbers.some((number, index) => number !== String(index)))
      errors.push(`Sibling IDs in ${prefix} must start at 0 and be sequential.`);
  }
  return errors;
}

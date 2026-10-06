export function validateSpecificationIds(documents, namespace) {
  const errors = [];
  const ids = new Set();
  for (const { path, directives } of documents)
    checkSiblings(directives, path, namespace, ids, errors, null);
  return errors;
}

function checkSiblings(rules, path, namespace, ids, errors, parentId) {
  if (!Array.isArray(rules)) return;
  const groups = new Map();
  for (const rule of rules) {
    if (typeof rule?.id !== "string" || !/^E-\d+(?:\.\d+)*$/u.test(rule.id)) continue;
    if (namespace && !rule.id.startsWith(`${namespace}.`) && rule.id !== namespace)
      errors.push(`${path} rule ${rule.id} must use the assigned ${namespace} namespace.`);
    if (
      parentId &&
      (rule.id.split(".").length !== parentId.split(".").length + 1 ||
        !rule.id.startsWith(`${parentId}.`))
    )
      errors.push(`${path} child rule ${rule.id} must extend parent ${parentId}.`);
    if (ids.has(rule.id)) errors.push(`Duplicate specification rule ID: ${rule.id}.`);
    ids.add(rule.id);
    const parts = rule.id.split(".");
    const prefix = parts.slice(0, -1).join(".");
    groups.set(prefix, [...(groups.get(prefix) ?? []), Number(parts.at(-1))]);
    checkSiblings(rule.children, path, namespace, ids, errors, rule.id);
  }
  for (const [prefix, numbers] of groups) {
    numbers.sort((left, right) => left - right);
    if (numbers.some((number, index) => number !== index))
      errors.push(`${path} sibling IDs under ${prefix} must start at 0 and be sequential.`);
  }
}

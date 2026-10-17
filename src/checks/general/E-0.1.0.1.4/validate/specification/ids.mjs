import { validateSiblingSequences } from "./sibling-sequences.mjs";

export function validateSpecificationIds(documents, namespace) {
  const errors = [];
  const ids = new Set();
  const ruleIds = [];
  for (const { path, directives } of documents)
    checkSiblings(directives, path, namespace, ids, ruleIds, errors, null);
  errors.push(...validateSiblingSequences(ruleIds));
  return errors;
}

function checkSiblings(rules, path, namespace, ids, ruleIds, errors, parentId) {
  if (!Array.isArray(rules)) return;
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
    ruleIds.push(rule.id);
    checkSiblings(rule.children, path, namespace, ids, ruleIds, errors, rule.id);
  }
}

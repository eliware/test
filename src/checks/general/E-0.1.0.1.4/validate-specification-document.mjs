const documentFields = new Set(["version", "description", "requires", "directives"]);
const directiveFields = new Set(["id", "dos", "donts", "examples", "children"]);

export function validateSpecificationDocument(value, path) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return [`${path} must contain a document object.`];
  if (Object.keys(value).some((key) => !documentFields.has(key)))
    errors.push(`${path} contains unsupported document fields.`);
  for (const field of ["version", "description"])
    if (typeof value[field] !== "string" || !value[field].trim())
      errors.push(`${path}.${field} must be a nonempty string.`);
  if (
    value.requires !== undefined &&
    (!Array.isArray(value.requires) ||
      value.requires.some(
        (profile) => typeof profile !== "string" || !/^[a-z0-9-]+$/u.test(profile),
      ))
  )
    errors.push(`${path}.requires must list valid profile names.`);
  validateRules(value.directives, `${path}.directives`, errors);
  return errors;
}

function validateRules(rules, label, errors) {
  if (!Array.isArray(rules) || !rules.length) {
    errors.push(`${label} must be a nonempty array.`);
    return;
  }
  for (const [index, rule] of rules.entries()) {
    const path = `${label}[${index}]`;
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      errors.push(`${path} must be an object.`);
      continue;
    }
    if (Object.keys(rule).some((key) => !directiveFields.has(key)))
      errors.push(`${path} contains unsupported fields.`);
    if (typeof rule.id !== "string" || !/^E-\d+(?:\.\d+)*$/u.test(rule.id))
      errors.push(`${path}.id must be a valid E-rule ID.`);
    for (const field of ["dos", "donts"])
      if (
        !Array.isArray(rule[field]) ||
        !rule[field].length ||
        rule[field].some((text) => typeof text !== "string" || !text.trim())
      )
        errors.push(`${path}.${field} must be a nonempty string list.`);
    if (
      rule.examples !== undefined &&
      (!Array.isArray(rule.examples) ||
        !rule.examples.length ||
        rule.examples.some((text) => typeof text !== "string" || !text.trim()))
    )
      errors.push(`${path}.examples must be a nonempty string list.`);
    if (rule.children !== undefined) validateRules(rule.children, `${path}.children`, errors);
  }
}

import { validateOrderingSpecificationDocument } from "../ordering-specification-document.mjs";
import { validateSpecificationRules } from "./rules.mjs";

const documentFields = new Set(["version", "description", "directives"]);

export function validateSpecificationDocument(value, path, { ordering = true } = {}) {
  if (ordering && path.startsWith("specs/conventions/ordering/"))
    return validateOrderingSpecificationDocument(value, path);
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return [`${path} must contain a document object.`];
  if (Object.keys(value).some((key) => !documentFields.has(key)))
    errors.push(`${path} contains unsupported document fields.`);
  for (const field of ["version", "description"])
    if (typeof value[field] !== "string" || !value[field].trim())
      errors.push(`${path}.${field} must be a nonempty string.`);
  errors.push(...validateSpecificationRules(value.directives, `${path}.directives`));
  return errors;
}

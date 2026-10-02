const allowedFields = new Set(["id", "dos", "donts", "directives", "examples"]);
import { validateExampleProfileHeadings } from "./validate-example-profile-headings.mjs";

function validateStringList(values, label, errors) {
  if (!Array.isArray(values) || values.length === 0) {
    errors.push(`${label} must be a non-empty array.`);
    return;
  }
  values.forEach((value, index) => {
    if (typeof value !== "string" || value.trim().length === 0)
      errors.push(`${label}[${index}] must be a non-empty string.`);
  });
}

function validateExample(example, label, errors) {
  if (!example || typeof example !== "object" || Array.isArray(example)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  if (
    Object.keys(example).some(
      (key) => !["purpose", "markdown", "generalHeadings", "profileHeadings"].includes(key),
    )
  )
    errors.push(`${label} contains an unsupported field.`);
  for (const field of ["purpose", "markdown"])
    if (typeof example[field] !== "string" || example[field].trim().length === 0)
      errors.push(`${label}.${field} must be a non-empty string.`);
  if (example.generalHeadings !== undefined)
    validateStringList(example.generalHeadings, `${label}.generalHeadings`, errors);
  if (example.profileHeadings !== undefined) {
    validateExampleProfileHeadings(example.profileHeadings, `${label}.profileHeadings`, errors);
  }
}

function validateRecord(record, label, errors) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  if (Object.keys(record).some((key) => !allowedFields.has(key)))
    errors.push(`${label} contains an unsupported field.`);
  if (typeof record.id !== "string" || !/^[EA]-\d+(?:\.\d+)*$/u.test(record.id))
    errors.push(`${label}.id must be a valid E- or A-prefixed ID.`);
  validateStringList(record.dos, `${label}.dos`, errors);
  validateStringList(record.donts, `${label}.donts`, errors);
  if (record.directives !== undefined) {
    if (!Array.isArray(record.directives) || record.directives.length === 0)
      errors.push(`${label}.directives must be a non-empty array when present.`);
    else
      record.directives.forEach((child, index) =>
        validateRecord(child, `${label}.directives[${index}]`, errors),
      );
  }
  if (record.examples !== undefined) {
    if (!Array.isArray(record.examples)) errors.push(`${label}.examples must be an array.`);
    else
      record.examples.forEach((example, index) =>
        validateExample(example, `${label}.examples[${index}]`, errors),
      );
  }
}

export function validateDirectiveRecords(records, label = "directives") {
  const errors = [];
  if (!Array.isArray(records) || records.length === 0)
    return [`${label} must be a non-empty array.`];
  records.forEach((record, index) => validateRecord(record, `${label}[${index}]`, errors));
  return errors;
}

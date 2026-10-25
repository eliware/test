export function validateRunbookArray(value, schema, path, validateValue) {
  if (!Array.isArray(value)) return [`${path} must be an array.`];
  const errors = [];
  if (schema.minItems !== undefined && value.length < schema.minItems)
    errors.push(`${path} must contain at least one step.`);
  value.forEach((item, index) =>
    errors.push(...validateValue(item, schema.items, `${path}[${index}]`)),
  );
  return errors;
}

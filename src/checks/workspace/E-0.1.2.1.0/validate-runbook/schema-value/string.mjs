export function validateRunbookString(value, schema, path) {
  if (typeof value !== "string") return [`${path} must be a string.`];
  if (schema.minLength !== undefined && value.length < schema.minLength)
    return [`${path} must not be empty.`];
  if (schema.pattern && !new RegExp(schema.pattern, "u").test(value))
    return [`${path} must contain a non-space character.`];
  return [];
}

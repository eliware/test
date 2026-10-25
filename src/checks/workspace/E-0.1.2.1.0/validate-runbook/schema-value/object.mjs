export function validateRunbookObject(value, schema, path, validateValue) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return [`${path} must be an object.`];
  const errors = [];
  for (const name of schema.required ?? [])
    if (!Object.hasOwn(value, name)) errors.push(`${path}.${name} is required.`);
  for (const [name, propertySchema] of Object.entries(schema.properties ?? {}))
    if (Object.hasOwn(value, name))
      errors.push(...validateValue(value[name], propertySchema, `${path}.${name}`));
  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties ?? {}));
    for (const name of Object.keys(value))
      if (!allowed.has(name)) errors.push(`${path}.${name} is not allowed.`);
  }
  return errors;
}

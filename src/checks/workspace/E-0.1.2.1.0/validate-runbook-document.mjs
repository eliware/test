import { parseAllDocuments } from "yaml";

export function validateRunbookDocument(content, path, schema) {
  let documents;
  try {
    documents = parseAllDocuments(content);
  } catch (error) {
    return [`${path} is invalid YAML: ${error.message}`];
  }
  const parseError = documents.flatMap((document) => document.errors)[0];
  if (parseError) return [`${path} is invalid YAML: ${parseError.message}`];
  if (documents.length !== 1) return [`${path} must contain one YAML document.`];
  try {
    return validateSchemaValue(documents[0].toJS(), schema, path);
  } catch (error) {
    return [`${path} could not be validated: ${error.message}`];
  }
}

function validateSchemaValue(value, schema, path) {
  if (Object.hasOwn(schema, "const"))
    return value === schema.const ? [] : [`${path} must equal the required value.`];
  if (schema.type === "object") return validateObject(value, schema, path);
  if (schema.type === "string") return validateString(value, schema, path);
  if (schema.type === "array") return validateArray(value, schema, path);
  throw new Error(`Unsupported schema type: ${schema.type ?? "unspecified"}.`);
}

function validateObject(value, schema, path) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return [`${path} must be an object.`];
  const errors = [];
  for (const name of schema.required ?? [])
    if (!Object.hasOwn(value, name)) errors.push(`${path}.${name} is required.`);
  for (const [name, propertySchema] of Object.entries(schema.properties ?? {}))
    if (Object.hasOwn(value, name))
      errors.push(...validateSchemaValue(value[name], propertySchema, `${path}.${name}`));
  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties ?? {}));
    for (const name of Object.keys(value))
      if (!allowed.has(name)) errors.push(`${path}.${name} is not allowed.`);
  }
  return errors;
}

function validateString(value, schema, path) {
  if (typeof value !== "string") return [`${path} must be a string.`];
  if (schema.minLength !== undefined && value.length < schema.minLength)
    return [`${path} must not be empty.`];
  if (schema.pattern && !new RegExp(schema.pattern, "u").test(value))
    return [`${path} must contain a non-space character.`];
  return [];
}

function validateArray(value, schema, path) {
  if (!Array.isArray(value)) return [`${path} must be an array.`];
  const errors = [];
  if (schema.minItems !== undefined && value.length < schema.minItems)
    errors.push(`${path} must contain at least one step.`);
  value.forEach((item, index) =>
    errors.push(...validateSchemaValue(item, schema.items, `${path}[${index}]`)),
  );
  return errors;
}

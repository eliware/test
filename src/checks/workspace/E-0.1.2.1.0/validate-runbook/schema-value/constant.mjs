export function validateRunbookConstant(value, schema, path) {
  return value === schema.const ? [] : [`${path} must equal the required value.`];
}

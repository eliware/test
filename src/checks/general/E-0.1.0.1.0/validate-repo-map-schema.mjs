import Ajv from "ajv";
import addFormats from "ajv-formats";

export function validateRepoMapAgainstSchema(value, schema) {
  let validate;
  try {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    validate = ajv.compile(schema);
  } catch (error) {
    return `repo-map-schema.yaml is invalid: ${error.message}`;
  }
  if (validate(value)) return null;
  const details = validate.errors
    .map(({ instancePath, message }) => `${instancePath || "/"} ${message}`)
    .join("; ");
  return `repo-map.yaml does not match repo-map-schema.yaml: ${details}.`;
}

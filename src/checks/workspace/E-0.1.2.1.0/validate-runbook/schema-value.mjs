import { validateRunbookArray } from "./schema-value/array.mjs";
import { validateRunbookConstant } from "./schema-value/constant.mjs";
import { validateRunbookObject } from "./schema-value/object.mjs";
import { validateRunbookString } from "./schema-value/string.mjs";

export function validateRunbookSchemaValue(value, schema, path) {
  if (Object.hasOwn(schema, "const")) return validateRunbookConstant(value, schema, path);
  if (schema.type === "object")
    return validateRunbookObject(value, schema, path, validateRunbookSchemaValue);
  if (schema.type === "string") return validateRunbookString(value, schema, path);
  if (schema.type === "array")
    return validateRunbookArray(value, schema, path, validateRunbookSchemaValue);
  throw new Error(`Unsupported schema type: ${schema.type ?? "unspecified"}.`);
}

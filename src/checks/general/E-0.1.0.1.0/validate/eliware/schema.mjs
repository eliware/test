import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const schemaUrl = new URL("../../../../../../specs/eliware-schema.yaml", import.meta.url);
const schema = parse(readFileSync(schemaUrl, "utf8"));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validator = ajv.compile(schema);

export function validateEliwareSchema(value) {
  if (validator(value)) return [];
  return validator.errors.map(({ instancePath, message }) => `${instancePath || "/"} ${message}`);
}

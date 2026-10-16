import { expect, test } from "@jest/globals";
import {
  expectedDirectiveSchema,
  validateDirectiveSchema,
} from "../../../../../src/checks/general/E-0.1.0.1.4/validate/directive-schema.mjs";

test("accepts the canonical directive schema", () => {
  expect(validateDirectiveSchema(expectedDirectiveSchema)).toEqual([]);
});

test("rejects incomplete or invalid schema definitions", () => {
  expect(validateDirectiveSchema({})).toEqual([
    "specs/directives-schema.yaml must define the document and directive schema.",
  ]);
});

test("rejects weakened property types and nested item constraints", () => {
  const schema = structuredClone(expectedDirectiveSchema);
  schema.$defs.document.properties.version.type = "number";
  expect(validateDirectiveSchema(schema)).not.toEqual([]);
  schema.$defs.document.properties.version.type = "string";
  schema.$defs.directive.properties.children.items = { type: "object" };
  expect(validateDirectiveSchema(schema)).not.toEqual([]);
});

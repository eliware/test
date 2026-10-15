import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { validateDirectiveSchema } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/directive-schema.mjs";

test("accepts the repository's directive schema", async () => {
  const schema = parse(await readFile("specs/directives-schema.yaml", "utf8"));
  expect(validateDirectiveSchema(schema)).toEqual([]);
});

test("rejects incomplete or invalid schema definitions", () => {
  expect(validateDirectiveSchema({})).toEqual([
    "specs/directives-schema.yaml must define the document and directive schema.",
  ]);
});

test("rejects weakened property types and nested item constraints", async () => {
  const schema = parse(await readFile("specs/directives-schema.yaml", "utf8"));
  schema.$defs.document.properties.version.type = "number";
  expect(validateDirectiveSchema(schema)).not.toEqual([]);
  schema.$defs.document.properties.version.type = "string";
  schema.$defs.directive.properties.children.items = { type: "object" };
  expect(validateDirectiveSchema(schema)).not.toEqual([]);
});

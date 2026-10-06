import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { validateV12DirectiveSchema } from "../../../../src/checks/general/E-0.1.0.1.4/validate-v12-directive-schema.mjs";

test("accepts the repository's v12 directive schema", async () => {
  const schema = parse(await readFile("specs/directives-schema.yaml", "utf8"));
  expect(validateV12DirectiveSchema(schema)).toEqual([]);
});

test("rejects incomplete or invalid schema definitions", () => {
  expect(validateV12DirectiveSchema({})).toEqual([
    "specs/directives-schema.yaml must define the v12 document and directive schema.",
  ]);
});

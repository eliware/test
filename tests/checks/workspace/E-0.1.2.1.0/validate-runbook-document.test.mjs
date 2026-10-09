import { expect, test } from "@jest/globals";
import { readRunbookSchema } from "../../../../src/checks/workspace/E-0.1.2.1.0/read-runbook-schema.mjs";
import { validateRunbookDocument } from "../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook-document.mjs";

const schema = await readRunbookSchema();
const valid = "schema-version: 12\ntitle: Deploy\nsteps:\n  - Run npm test";

test("accepts a valid single-document runbook", () => {
  expect(validateRunbookDocument(valid, "runbooks/deploy.yaml", schema)).toEqual([]);
});

test("rejects invalid YAML and multiple YAML documents", () => {
  expect(validateRunbookDocument("steps: [", "bad.yaml", schema)[0]).toContain("invalid YAML");
  expect(validateRunbookDocument(`${valid}\n---\n${valid}`, "multi.yaml", schema)).toEqual([
    "multi.yaml must contain one YAML document.",
  ]);
  expect(validateRunbookDocument({}, "bad-input.yaml", schema)[0]).toContain("invalid YAML");
});

test("enforces runbook fields, values, and additional property rules", () => {
  const invalid = "schema-version: 11\ntitle: '   '\nsteps: []\nextra: true";
  const errors = validateRunbookDocument(invalid, "invalid.yaml", schema);
  expect(errors).toContain("invalid.yaml.schema-version must equal the required value.");
  expect(errors).toContain("invalid.yaml.title must contain a non-space character.");
  expect(errors).toContain("invalid.yaml.steps must contain at least one step.");
  expect(errors).toContain("invalid.yaml.extra is not allowed.");
});

test("requires an object with all required fields and correctly typed values", () => {
  const errors = validateRunbookDocument(
    "schema-version: 12\ntitle: 3\nsteps: [false]\nunknown: value",
    "typed.yaml",
    schema,
  );
  expect(errors).toContain("typed.yaml.title must be a string.");
  expect(errors).toContain("typed.yaml.steps[0] must be a string.");
  expect(errors).toContain("typed.yaml.unknown is not allowed.");
  expect(validateRunbookDocument("- item", "array.yaml", schema)).toEqual([
    "array.yaml must be an object.",
  ]);
  expect(validateRunbookDocument("null", "null.yaml", schema)).toEqual([
    "null.yaml must be an object.",
  ]);
  expect(validateRunbookDocument("title", "string.yaml", schema)).toEqual([
    "string.yaml must be an object.",
  ]);
});

test("reports missing fields and blank steps", () => {
  expect(validateRunbookDocument("schema-version: 12", "missing.yaml", schema)).toEqual([
    "missing.yaml.title is required.",
    "missing.yaml.steps is required.",
  ]);
  expect(
    validateRunbookDocument("schema-version: 12\ntitle: ''\nsteps: invalid", "empty.yaml", schema),
  ).toContain("empty.yaml.title must not be empty.");
  expect(
    validateRunbookDocument(
      "schema-version: 12\ntitle: Deploy\nsteps: ['  ']",
      "blank.yaml",
      schema,
    ),
  ).toContain("blank.yaml.steps[0] must contain a non-space character.");
});

test("accepts an object schema with optional property metadata", () => {
  expect(
    validateRunbookDocument("value: 1", "custom.yaml", {
      type: "object",
      required: null,
      properties: null,
      additionalProperties: true,
    }),
  ).toEqual([]);
});

test("rejects a non-array steps value", () => {
  expect(
    validateRunbookDocument(
      "schema-version: 12\ntitle: Deploy\nsteps: no",
      "not-array.yaml",
      schema,
    ),
  ).toContain("not-array.yaml.steps must be an array.");
});

test("reports an unsupported schema type", () => {
  expect(validateRunbookDocument(valid, "bad-schema.yaml", { type: "number" })).toEqual([
    "bad-schema.yaml could not be validated: Unsupported schema type: number.",
  ]);
  expect(validateRunbookDocument(valid, "unknown-schema.yaml", {})).toEqual([
    "unknown-schema.yaml could not be validated: Unsupported schema type: unspecified.",
  ]);
});

test("rejects extra fields when an object schema omits its properties map", () => {
  expect(
    validateRunbookDocument("extra: true", "extra.yaml", {
      type: "object",
      additionalProperties: false,
    }),
  ).toEqual(["extra.yaml.extra is not allowed."]);
});

import { expect, test } from "@jest/globals";
import { validateRunbookSchemaValue } from "../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/schema-value.mjs";

test("validates object fields, required keys, and additional properties", () => {
  const schema = {
    type: "object",
    required: ["name"],
    properties: { name: { type: "string", minLength: 1 } },
    additionalProperties: false,
  };
  expect(validateRunbookSchemaValue({ name: "runbook" }, schema, "runbook")).toEqual([]);
  expect(validateRunbookSchemaValue({ extra: true }, schema, "runbook")).toEqual([
    "runbook.name is required.",
    "runbook.extra is not allowed.",
  ]);
  expect(validateRunbookSchemaValue([], schema, "runbook")).toEqual(["runbook must be an object."]);
  expect(validateRunbookSchemaValue(1, schema, "runbook")).toEqual(["runbook must be an object."]);
  expect(
    validateRunbookSchemaValue({ name: "runbook" }, { type: "object", properties: {} }, "item"),
  ).toEqual([]);
  expect(
    validateRunbookSchemaValue(
      { extra: true },
      { type: "object", additionalProperties: false },
      "item",
    ),
  ).toEqual(["item.extra is not allowed."]);
});

test("validates strings and constant values", () => {
  expect(validateRunbookSchemaValue("ready", { type: "string", pattern: "\\S" }, "step")).toEqual(
    [],
  );
  expect(validateRunbookSchemaValue("  ", { type: "string", pattern: "\\S" }, "step")).toEqual([
    "step must contain a non-space character.",
  ]);
  expect(validateRunbookSchemaValue("wrong", { const: "ready" }, "status")).toEqual([
    "status must equal the required value.",
  ]);
  expect(validateRunbookSchemaValue("ready", { const: "ready" }, "status")).toEqual([]);
  expect(validateRunbookSchemaValue(1, { type: "string" }, "step")).toEqual([
    "step must be a string.",
  ]);
  expect(validateRunbookSchemaValue("ready", { type: "string" }, "step")).toEqual([]);
});

test("validates arrays recursively and reports unsupported schema types", () => {
  const schema = { type: "array", minItems: 1, items: { type: "string", minLength: 1 } };
  expect(validateRunbookSchemaValue(["step"], schema, "steps")).toEqual([]);
  expect(validateRunbookSchemaValue([""], schema, "steps")).toEqual([
    "steps[0] must not be empty.",
  ]);
  expect(validateRunbookSchemaValue([], schema, "steps")).toEqual([
    "steps must contain at least one step.",
  ]);
  expect(validateRunbookSchemaValue("step", schema, "steps")).toEqual(["steps must be an array."]);
  expect(
    validateRunbookSchemaValue(["step"], { type: "array", items: { type: "string" } }, "steps"),
  ).toEqual([]);
  expect(() => validateRunbookSchemaValue(1, { type: "number" }, "value")).toThrow(
    "Unsupported schema type: number.",
  );
  expect(() => validateRunbookSchemaValue(1, {}, "value")).toThrow(
    "Unsupported schema type: unspecified.",
  );
});

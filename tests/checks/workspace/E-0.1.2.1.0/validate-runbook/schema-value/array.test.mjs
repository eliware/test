import { expect, jest, test } from "@jest/globals";
import { validateRunbookArray } from "../../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/schema-value/array.mjs";

test("validates array type, minimum length, and each item", () => {
  const validateValue = jest.fn((value, _schema, path) =>
    value === "bad" ? [`${path} is invalid.`] : [],
  );
  const schema = { minItems: 2, items: { type: "string" } };

  expect(validateRunbookArray("bad", schema, "steps", validateValue)).toEqual([
    "steps must be an array.",
  ]);
  expect(validateRunbookArray(["ok"], schema, "steps", validateValue)).toEqual([
    "steps must contain at least one step.",
  ]);
  expect(validateRunbookArray(["ok", "bad"], schema, "steps", validateValue)).toEqual([
    "steps[1] is invalid.",
  ]);
  expect(validateValue).toHaveBeenCalledWith("bad", schema.items, "steps[1]");
});

import { expect, jest, test } from "@jest/globals";
import { validateRunbookObject } from "../../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/schema-value/object.mjs";

test("validates object type, required keys, properties, and extra keys", () => {
  const validateValue = jest.fn(() => []);
  const schema = {
    required: ["name"],
    properties: { name: { type: "string" } },
    additionalProperties: false,
  };

  expect(validateRunbookObject([], schema, "runbook", validateValue)).toEqual([
    "runbook must be an object.",
  ]);
  expect(validateRunbookObject({ extra: true }, schema, "runbook", validateValue)).toEqual([
    "runbook.name is required.",
    "runbook.extra is not allowed.",
  ]);
  expect(validateRunbookObject({ name: "ready" }, schema, "runbook", validateValue)).toEqual([]);
  expect(validateValue).toHaveBeenCalledWith("ready", schema.properties.name, "runbook.name");
});

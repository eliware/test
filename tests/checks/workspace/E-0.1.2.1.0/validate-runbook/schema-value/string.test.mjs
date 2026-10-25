import { expect, test } from "@jest/globals";
import { validateRunbookString } from "../../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/schema-value/string.mjs";

test("validates string type, minimum length, and pattern", () => {
  expect(validateRunbookString(1, {}, "step")).toEqual(["step must be a string."]);
  expect(validateRunbookString("", { minLength: 1 }, "step")).toEqual(["step must not be empty."]);
  expect(validateRunbookString("  ", { pattern: "\\S" }, "step")).toEqual([
    "step must contain a non-space character.",
  ]);
  expect(validateRunbookString("ready", { minLength: 1, pattern: "\\S" }, "step")).toEqual([]);
});

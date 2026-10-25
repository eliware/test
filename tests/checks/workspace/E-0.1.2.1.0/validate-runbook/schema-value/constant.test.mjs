import { expect, test } from "@jest/globals";
import { validateRunbookConstant } from "../../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/schema-value/constant.mjs";

test("accepts only the configured constant", () => {
  expect(validateRunbookConstant("ready", { const: "ready" }, "status")).toEqual([]);
  expect(validateRunbookConstant("wrong", { const: "ready" }, "status")).toEqual([
    "status must equal the required value.",
  ]);
});

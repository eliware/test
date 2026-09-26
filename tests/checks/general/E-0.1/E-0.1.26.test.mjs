import { expect, test } from "@jest/globals";
import { applicability, parentRuleId, ruleId } from "../../../../src/checks/general/E-0.1/E-0.1.26.mjs";

test("declares the parent convention without duplicating its child implementation", () => {
  expect({ applicability, parentRuleId, ruleId }).toEqual({
    applicability: "advisory-only",
    parentRuleId: "E-0.1",
    ruleId: "E-0.1.26",
  });
});

import { expect, test } from "@jest/globals";
import * as check from "../../../../src/checks/application/E-0.1.130/E-0.1.130.11.mjs";

test("marks common stack adoption as advisory application review without a placeholder pass", () => {
  expect(check).toMatchObject({
    ruleId: "E-0.1.130.11",
    parentRuleId: "E-0.1.130",
    applicability: "advisory-only",
  });
  expect(check.run).toBeUndefined();
});

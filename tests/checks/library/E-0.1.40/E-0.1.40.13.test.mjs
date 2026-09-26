import { expect, test } from "@jest/globals";
import * as check from "../../../../src/checks/library/E-0.1.40/E-0.1.40.13.mjs";

test("marks common stack adoption as advisory library review without a placeholder pass", () => {
  expect(check).toMatchObject({
    ruleId: "E-0.1.40.13",
    parentRuleId: "E-0.1.40",
    applicability: "advisory-only",
  });
  expect(check.run).toBeUndefined();
});

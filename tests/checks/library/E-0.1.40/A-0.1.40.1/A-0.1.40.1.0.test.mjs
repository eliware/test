import { expect, test } from "@jest/globals";
import * as check from "../../../../../src/checks/library/E-0.1.40/A-0.1.40.1/A-0.1.40.1.0.mjs";

test("marks environment-template completeness as a human review", () => {
  expect(check).toMatchObject({
    ruleId: "A-0.1.40.1.0",
    parentRuleId: "A-0.1.40.1",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
  expect(check.run).toBeUndefined();
});

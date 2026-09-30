import { expect, test } from "@jest/globals";
import * as check from "../../../../../../src/checks/application/E-0.1.130/A-0.1.130.0/A-0.1.130.0.1/A-0.1.130.0.1.0.mjs";

test("marks environment-template completeness as a human review", () => {
  expect(check).toMatchObject({
    ruleId: "A-0.1.130.0.1.0",
    parentRuleId: "A-0.1.130.0.1",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
  expect(check.run).toBeUndefined();
});

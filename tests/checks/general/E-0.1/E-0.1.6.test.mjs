import { expect, test } from "@jest/globals";
import * as check from "../../../../src/checks/general/E-0.1/E-0.1.6.mjs";

test("declares sensitive-content review as non-deterministic and advisory-only", () => {
  expect(check).toMatchObject({
    ruleId: "E-0.1.6",
    parentRuleId: "E-0.1",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
  expect(check.run).toBeUndefined();
});

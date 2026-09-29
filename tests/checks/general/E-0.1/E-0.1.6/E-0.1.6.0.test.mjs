import { expect, test } from "@jest/globals";
import * as check from "../../../../../src/checks/general/E-0.1/E-0.1.6/E-0.1.6.0.mjs";

test("declares secret and private-data review as non-deterministic and advisory-only", () => {
  expect(check).toMatchObject({
    ruleId: "E-0.1.6.0",
    parentRuleId: "E-0.1.6",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
  expect(check.run).toBeUndefined();
});

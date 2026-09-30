import { expect, test } from "@jest/globals";
import {
  applicability,
  enforcementMode,
  parentRuleId,
  ruleId,
} from "../../../../src/checks/application/E-0.1.130/E-0.1.130.7.mjs";

test("marks human-review guidance as advisory instead of passing it", () => {
  expect({ ruleId, parentRuleId, enforcementMode, applicability }).toEqual({
    ruleId: "E-0.1.130.7",
    parentRuleId: "E-0.1.130",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
});

import { expect, test } from "@jest/globals";
import {
  applicability,
  enforcementMode,
  parentRuleId,
  ruleId,
} from "../../../../src/checks/general/E-0.1/E-0.1.12.mjs";

test("marks human-review guidance as advisory instead of passing it", () => {
  expect({ ruleId, parentRuleId, enforcementMode, applicability }).toEqual({
    ruleId: "E-0.1.12",
    parentRuleId: "E-0.1",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
});

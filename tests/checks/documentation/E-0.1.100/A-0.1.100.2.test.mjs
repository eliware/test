import { expect, test } from "@jest/globals";
import * as check from "../../../../src/checks/documentation/E-0.1.100/A-0.1.100.2.mjs";

test("marks documentation surface indexing as advisory human review", () => {
  expect(check.ruleId).toBe("A-0.1.100.2");
  expect(check.parentRuleId).toBe("E-0.1.100");
  expect(check.enforcementMode).toBe("non-deterministic");
  expect(check.applicability).toBe("advisory-only");
  expect(check.run).toBeUndefined();
});

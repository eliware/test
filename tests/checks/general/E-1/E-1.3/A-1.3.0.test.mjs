import { expect, test } from "@jest/globals";
import * as check from "../../../../../src/checks/general/E-1/E-1.3/A-1.3.0.mjs";

test("returns the reindexed convention rule identity", () => {
  expect(check.enforcementMode).toBe("non-deterministic");
  expect(check.run()).toEqual({ ruleId: "A-1.3.0", status: "pass", message: "" });
});

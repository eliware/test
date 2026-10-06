import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/workspace/E-0.1.2.1.0.mjs";

test("E-0.1.2.1.0 returns a passing placeholder result", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

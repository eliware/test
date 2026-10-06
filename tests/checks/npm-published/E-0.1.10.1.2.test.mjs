import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.2.mjs";

test("E-0.1.10.1.2 returns a passing placeholder result", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

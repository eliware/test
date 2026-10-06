import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/discord/E-0.1.7.1.0.mjs";

test("E-0.1.7.1.0 returns a passing placeholder result", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

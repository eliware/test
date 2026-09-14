import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/infrastructure/E-1.90/A-1.90.0/A-1.90.0.2.mjs";

test("passes the non-deterministic infrastructure child rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

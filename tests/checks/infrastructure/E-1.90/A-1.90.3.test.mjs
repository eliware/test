import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/infrastructure/E-1.90/A-1.90.3.mjs";

test("passes the non-deterministic infrastructure rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/fork/E-1.120/E-1.120.0.mjs";

test("passes the non-deterministic fork child rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

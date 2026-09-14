import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.7.mjs";

test("passes the non-deterministic exemption governance rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

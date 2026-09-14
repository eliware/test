import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-1.mjs";

test("passes the general convention root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

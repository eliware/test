import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-1.130.mjs";

test("passes the application profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

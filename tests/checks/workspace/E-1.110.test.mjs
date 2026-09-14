import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/workspace/E-1.110.mjs";

test("passes the workspace profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

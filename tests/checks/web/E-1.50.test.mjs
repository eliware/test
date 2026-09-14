import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/web/E-1.50.mjs";

test("passes the web profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

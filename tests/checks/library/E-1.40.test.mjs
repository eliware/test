import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/library/E-1.40.mjs";

test("passes the library profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

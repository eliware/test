import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/infrastructure/E-1.90.mjs";

test("passes the infrastructure profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

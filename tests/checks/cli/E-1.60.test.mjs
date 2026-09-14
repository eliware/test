import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/cli/E-1.60.mjs";

test("passes the CLI profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

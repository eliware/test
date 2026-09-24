import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/application/E-1.130/E-1.130.14/A-1.130.14.0.mjs";

test("accepts a package without an application coverage exemption", () => {
  expect(run({ packageJson: {} })).toEqual({ ruleId, status: "pass", message: "" });
});

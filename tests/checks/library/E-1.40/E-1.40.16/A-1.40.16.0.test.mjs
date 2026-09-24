import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/library/E-1.40/E-1.40.16/A-1.40.16.0.mjs";

test("accepts a package without a library coverage exemption", () => {
  expect(run({ packageJson: {} })).toEqual({ ruleId, status: "pass", message: "" });
});

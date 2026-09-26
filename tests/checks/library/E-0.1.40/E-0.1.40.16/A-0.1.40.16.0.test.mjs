import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/library/E-0.1.40/E-0.1.40.16/A-0.1.40.16.0.mjs";

test("accepts a package without a library coverage exemption", () => {
  expect(run({ packageJson: {} })).toEqual({ ruleId, status: "pass", message: "" });
});

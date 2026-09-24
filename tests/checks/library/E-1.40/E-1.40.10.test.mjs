import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.10.mjs";

test("marks obsolete compatibility review as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

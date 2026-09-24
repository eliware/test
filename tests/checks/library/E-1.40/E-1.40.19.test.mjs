import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.19.mjs";

test("marks library dependency design as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

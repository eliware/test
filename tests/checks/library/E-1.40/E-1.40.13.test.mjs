import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.13.mjs";

test("marks common stack adoption as advisory library review", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

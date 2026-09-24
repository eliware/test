import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.11.mjs";

test("marks common stack adoption as advisory application review", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

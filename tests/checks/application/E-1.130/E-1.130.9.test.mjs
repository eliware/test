import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.9.mjs";

test("marks application test placement as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

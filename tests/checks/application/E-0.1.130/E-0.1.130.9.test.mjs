import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-0.1.130/E-0.1.130.9.mjs";

test("marks application test placement as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

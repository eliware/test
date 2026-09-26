import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-0.1.130/E-0.1.130.17.mjs";

test("marks application dependency design as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.6.mjs";

test("marks application module decomposition as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

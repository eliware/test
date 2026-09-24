import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.16.mjs";

test("marks application entrypoint design as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

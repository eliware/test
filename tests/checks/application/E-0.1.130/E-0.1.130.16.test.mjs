import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-0.1.130/E-0.1.130.16.mjs";

test("marks application entrypoint design as a human-review check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.6.mjs";

test("passes the general artifact-safety parent rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

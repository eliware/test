import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.15.mjs";

test("passes the non-deterministic rule without inventing validation", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

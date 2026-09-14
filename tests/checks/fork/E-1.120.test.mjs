import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/fork/E-1.120.mjs";

test("passes the non-deterministic fork rule without inventing validation", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

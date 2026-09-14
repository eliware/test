import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.3.mjs";

test("passes the non-deterministic runtime convention rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

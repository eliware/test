import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.26.mjs";

test("passes the general convention rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.25.mjs";

test("passes the general structured-reference parent rule", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

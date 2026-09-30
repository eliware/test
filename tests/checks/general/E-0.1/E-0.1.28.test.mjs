import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-0.1/E-0.1.28.mjs";

test("reports the repository file safety rule", () => {
  expect(ruleId).toBe("E-0.1.28");
  expect(run()).toEqual({ status: "pass", ruleId, message: "" });
});

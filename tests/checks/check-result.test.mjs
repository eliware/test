import { expect, test } from "@jest/globals";
import { assertCheckResult, fail, pass } from "../../src/checks/check-result.mjs";

test("creates pass and fail results with stable shapes", () => {
  expect(pass("E-1.0")).toEqual({ ruleId: "E-1.0", status: "pass", message: "" });
  expect(fail("E-1.0", "bad")).toEqual({ ruleId: "E-1.0", status: "fail", message: "bad" });
});

test("accepts only matching pass or fail results", () => {
  expect(assertCheckResult(pass("E-1.0"), "E-1.0")).toEqual(pass("E-1.0"));
  expect(() =>
    assertCheckResult({ ruleId: "E-1.1", status: "pass", message: "" }, "E-1.0"),
  ).toThrow("Check E-1.0 returned an invalid result.");
  expect(() =>
    assertCheckResult({ ruleId: "E-1.0", status: "skip", message: "" }, "E-1.0"),
  ).toThrow();
});

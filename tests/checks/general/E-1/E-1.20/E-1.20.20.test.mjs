import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.20.mjs";

test("passes when Jest is not executed or has already failed", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId: "E-1.20.20", status: "pass", message: "" });
  await expect(run({ executeJest: true, jestResult: { code: 1, stdout: "noise" } })).resolves.toEqual({
    ruleId: "E-1.20.20", status: "pass", message: "",
  });
});

test("maps an unexpected-output finding to the check result", async () => {
  await expect(run({ executeJest: true, jestResult: { code: 0, stdout: "PASS tests/example.test.mjs\n" } })).resolves.toEqual({
    ruleId: "E-1.20.20", status: "pass", message: "",
  });
  await expect(run({ executeJest: true, jestResult: { code: 0, stdout: "console leak\n" } })).resolves.toEqual({
    ruleId: "E-1.20.20", status: "fail", message: "Unexpected test-process output detected: Unexpected output from unknown test suite: console leak",
  });
});

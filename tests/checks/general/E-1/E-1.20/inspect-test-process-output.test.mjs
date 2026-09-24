import { expect, test } from "@jest/globals";
import { inspectTestProcessOutput } from "../../../../../src/checks/general/E-1/E-1.20/inspect-test-process-output.mjs";
const ruleId = "E-1.130.15";
const run = (context) => inspectTestProcessOutput(context, ruleId);

test("passes when Jest is not executed or has already failed", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await expect(run({ executeJest: true, jestResult: { code: 1, stdout: "noise" } })).resolves.toEqual({
    ruleId, status: "pass", message: "",
  });
});

test("maps an unexpected-output finding to the check result", async () => {
  await expect(run({ executeJest: true, jestResult: { code: 0, stdout: "PASS tests/example.test.mjs\n" } })).resolves.toEqual({
    ruleId, status: "pass", message: "",
  });
  await expect(run({ executeJest: true, jestResult: { code: 0, stdout: "console leak\n" } })).resolves.toEqual({
    ruleId, status: "fail", message: "Unexpected test-process output detected: Unexpected output from unknown test suite: console leak",
  });
});

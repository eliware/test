import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.20.mjs";

test("passes when Jest is not executed or has already failed", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId: "E-1.20.20", status: "pass", message: "" });
  await expect(run({ executeJest: true, jestResult: { code: 1, stdout: "noise" } })).resolves.toEqual({
    ruleId: "E-1.20.20", status: "pass", message: "",
  });
});

test("passes quiet Jest output and fails unexpected output", async () => {
  await expect(run({ executeJest: true, jestResult: { code: 0, stdout: "PASS tests/example.test.mjs\n" } })).resolves.toEqual({
    ruleId: "E-1.20.20", status: "pass", message: "",
  });
  await expect(run({ executeJest: true, jestResult: { code: 0, stdout: "console leak\n" } })).resolves.toEqual({
    ruleId: "E-1.20.20", status: "fail", message: "Unexpected test-process output detected: console leak",
  });
});

test("fails when a test exceeds the five-second diagnostic threshold", async () => {
  await expect(run({
    executeJest: true,
    jestResult: {
      code: 0,
      stdout: "PASS tests/example.test.mjs\n",
      stderr: "[eliware-test-progress] slow tests/example.test.mjs :: slow case :: 5.001s\n",
    },
  })).resolves.toEqual({
    ruleId: "E-1.20.20",
    status: "fail",
    message: "Unexpected test-process output detected: Slow test in tests/example.test.mjs: slow case took 5.001s (limit: 5s).",
  });
});

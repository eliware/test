import { expect, test } from "@jest/globals";
import { classifyJestResult } from "../../../../../../src/checks/general/E-1/E-1.20/classify-jest-result.mjs";

test("classifies timeout, failure, and success results", () => {
  expect(classifyJestResult("E-1.20", { timedOut: true }, "timed out").status).toBe("fail");
  expect(classifyJestResult("E-1.20", { code: 1, stdout: "out", stderr: "err" }).message)
    .toBe("Jest failed: out\nerr");
  expect(classifyJestResult("E-1.20", { code: 1, stdout: "", stderr: "" }).message)
    .toBe("Jest failed without diagnostics.");
  expect(classifyJestResult("E-1.20", { code: 0 }).status).toBe("pass");
});

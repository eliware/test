import { expect, test } from "@jest/globals";
import { findUnexpectedJestStderr } from "../../../../../../../src/validation/stages/jest/progress/find/unexpected/stderr.mjs";

test("filters harness, diagnostic, and reporter output while redacting other lines", () => {
  const output = findUnexpectedJestStderr(
    "…\neliware-test-progress update\nE-0.1.20: diagnostic\nconsole.warn\nwarning text\nsecret trace\n",
    [{ testFilePath: "tests/sample.test.mjs", type: "warn", message: "warning text" }],
    ["secret trace"],
    process.cwd(),
  );

  expect(output).toEqual(["Unexpected output from unknown test suite: [REDACTED]"]);
});

test("returns an empty list when stderr is empty", () => {
  expect(findUnexpectedJestStderr("", [], [], process.cwd())).toEqual([]);
});

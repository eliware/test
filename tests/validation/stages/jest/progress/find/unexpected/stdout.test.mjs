import { expect, test } from "@jest/globals";
import { findUnexpectedJestStdout } from "../../../../../../../src/validation/stages/jest/progress/find/unexpected/stdout.mjs";

test("filters progress, truncation, and reporter output while redacting unexpected lines", () => {
  const output = findUnexpectedJestStdout(
    "…\neliware-progress update\nconsole.log\nvisible text\nsecret material\n",
    [{ testFilePath: "tests/sample.test.mjs", type: "log", message: "visible text" }],
    ["secret material"],
    process.cwd(),
  );

  expect(output).toEqual(["Unexpected output from unknown test suite: [REDACTED]"]);
});

test("returns an empty list when stdout is empty", () => {
  expect(findUnexpectedJestStdout("", [], [], process.cwd())).toEqual([]);
});

import { expect, test } from "@jest/globals";
import { writeStageDiagnostics } from "../../../src/cli/write/stage-diagnostics.mjs";

test("writes diagnostics and optional stage output in order", () => {
  const output = [];
  writeStageDiagnostics({ diagnostics: ["first", "second"], output: "summary" }, (message) =>
    output.push(message),
  );
  expect(output).toEqual(["first", "second", "summary"]);
});

test("handles absent diagnostics and absent or falsy output", () => {
  const output = [];
  writeStageDiagnostics({}, (message) => output.push(message));
  writeStageDiagnostics({ diagnostics: null, output: "" }, (message) => output.push(message));
  expect(output).toEqual([]);
});

test("keeps full Jest failure diagnostics in debug timing mode", () => {
  const output = [];
  writeStageDiagnostics(
    {
      diagnostics: ["E-0.1.130.13: Jest failed: FAIL tests/bad.test.mjs\nExpected: 1"],
    },
    (message) => output.push(message),
  );
  expect(output).toEqual(["E-0.1.130.13: Jest failed: FAIL tests/bad.test.mjs\nExpected: 1"]);
});

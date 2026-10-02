import { expect, test } from "@jest/globals";
import { writeStageDiagnostics } from "../../src/cli/write-stage-diagnostics.mjs";

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

test("omits the repeated Jest failure summary in debug timing mode", () => {
  const output = [];
  writeStageDiagnostics(
    {
      diagnostics: [
        "inline details",
        "E-0.1.130.13: Jest failed; see the inline suite failures above.",
      ],
    },
    (message) => output.push(message),
    true,
  );
  expect(output).toEqual(["inline details"]);
});

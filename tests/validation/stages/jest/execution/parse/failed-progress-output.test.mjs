import { expect, test } from "@jest/globals";
import { parseFailedJestProgressOutput } from "../../../../../../src/validation/stages/jest/execution/parse/failed-progress-output.mjs";

test("returns diagnostics from failed progress records", () => {
  const output = [
    '[eliware-test-progress] {"event":"start","path":"tests/active.test.mjs"}',
    '[eliware-test-progress] {"event":"result","path":"tests/pass.test.mjs","failed":false}',
    '[eliware-test-progress] {"event":"result","path":"tests/fail.test.mjs","failed":true,"failures":["assertion failed"],"unexpectedOutput":["extra output"]}',
    "[eliware-test-progress] {invalid}",
    "ordinary output",
  ].join("\n");
  expect(parseFailedJestProgressOutput(output)).toBe(
    "tests/fail.test.mjs\nassertion failed\nextra output",
  );
});

test("returns an empty result without failed records", () => {
  expect(parseFailedJestProgressOutput(undefined)).toBe("");
  expect(parseFailedJestProgressOutput("ordinary output")).toBe("");
});

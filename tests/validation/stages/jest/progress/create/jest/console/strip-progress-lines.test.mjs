import { expect, test } from "@jest/globals";
import { stripJestProgressLines } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/strip-progress-lines.mjs";

test("removes harness records and keeps surrounding Jest output unchanged", () => {
  expect(
    stripJestProgressLines(
      'PASS tests/example.test.mjs\r\n[eliware-test-progress] {"event":"start"}\r\nTests: 1 passed\r\n',
    ),
  ).toBe("PASS tests/example.test.mjs\r\nTests: 1 passed\r\n");
});

test("removes a progress record at the start or end of output", () => {
  expect(stripJestProgressLines('[eliware-test-progress] {"event":"start"}\nPASS test.mjs')).toBe(
    "PASS test.mjs",
  );
  expect(stripJestProgressLines('PASS test.mjs\n[eliware-test-progress] {"event":"end"}')).toBe(
    "PASS test.mjs\n",
  );
});

test("removes reporter records with terminal color codes", () => {
  expect(
    stripJestProgressLines("PASS test.mjs\n\u001b[32m[eliware-test-progress] {event}\nTests: 1\n"),
  ).toBe("PASS test.mjs\nTests: 1\n");
});

test("keeps text that does not contain the exact reporter marker", () => {
  expect(stripJestProgressLines("notice: eliware-test-progress text")).toBe(
    "notice: eliware-test-progress text",
  );
});

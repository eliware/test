import { expect, test } from "@jest/globals";
import { createJestProgressTracker } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-progress-tracker.mjs";

test("reports startup timeout until progress identifies a suite", () => {
  const progress = createJestProgressTracker();
  expect(progress.timeoutMessage()).toBe(
    "Test suite Jest startup timed out after 15 seconds without progress.",
  );

  expect(
    progress.readProgress(
      '[eliware-test-progress] {"event":"start","path":"tests/hanging.test.mjs"}\n',
    ),
  ).toEqual([{ event: "start", path: "tests/hanging.test.mjs" }]);
  expect(progress.timeoutMessage()).toBe(
    "Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.",
  );

  expect(progress.readProgress("[eliware-test-progress] not-json\n")).toEqual([]);
  expect(progress.readProgress('[eliware-test-progress] {"event":"start","path":3}\n')).toEqual([
    { event: "start", path: 3 },
  ]);
  expect(progress.readProgress('[eliware-test-progress] {"event":"result"}\n')).toEqual([
    { event: "result" },
  ]);
  expect(progress.readProgress('[eliware-test-progress] {"event":"other"}\n')).toEqual([]);
  progress.readProgress("unrecognized progress text\n");
  expect(progress.timeoutMessage()).toBe(
    "Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.",
  );
});

test("supports a configured timeout duration", () => {
  expect(createJestProgressTracker(2).timeoutMessage()).toContain("after 2 seconds");
});

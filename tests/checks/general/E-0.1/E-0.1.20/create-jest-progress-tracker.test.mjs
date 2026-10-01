import { expect, test } from "@jest/globals";
import { createJestProgressTracker } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-progress-tracker.mjs";

test("reports startup timeout until progress identifies a suite", () => {
  const progress = createJestProgressTracker();
  expect(progress.timeoutMessage()).toBe(
    "Test suite Jest startup timed out after 15 seconds without progress.",
  );

  progress.readProgress("[eliware-test-progress] start tests/hanging.test.mjs\n");
  expect(progress.timeoutMessage()).toBe(
    "Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.",
  );

  progress.readProgress("[eliware-test-progress] test tests/hanging.test.mjs :: test 4 0.100s\n");
  progress.readProgress("unrecognized progress text\n");
  expect(progress.timeoutMessage()).toBe(
    "Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.",
  );
});

test("supports a configured timeout duration", () => {
  expect(createJestProgressTracker(2).timeoutMessage()).toContain("after 2 seconds");
});

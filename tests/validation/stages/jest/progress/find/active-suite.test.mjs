import { expect, test } from "@jest/globals";
import { createActiveSuiteTracker } from "../../../../../../src/validation/stages/jest/progress/find/active-suite.mjs";

test("tracks the active test suite until its completion marker", () => {
  const tracker = createActiveSuiteTracker();

  expect(tracker.current()).toBe("unknown test suite");
  tracker.observe("[eliware-test-progress] start tests/example.test.mjs");
  expect(tracker.current()).toBe("tests/example.test.mjs");
  tracker.observe("ordinary Jest output");
  expect(tracker.current()).toBe("tests/example.test.mjs");
  tracker.observe("[eliware-test-progress] complete tests/example.test.mjs 0.100s");
  expect(tracker.current()).toBe("unknown test suite");
});

test("keeps the current suite when a line has no lifecycle marker", () => {
  const tracker = createActiveSuiteTracker("tests/current.test.mjs");
  tracker.observe("[eliware-test-progress] result tests/other.test.mjs");

  expect(tracker.current()).toBe("tests/current.test.mjs");
});

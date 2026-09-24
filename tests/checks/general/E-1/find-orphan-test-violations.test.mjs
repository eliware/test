import { expect, test } from "@jest/globals";
import { findOrphanTestViolations } from "../../../../src/checks/general/E-1/find-orphan-test-violations.mjs";

test("reports only unexpected Jest tests without an allowed integration role", () => {
  const files = ["orphan.test.mjs", "api.integration.test.mjs", "e2e-flow.test.mjs", "smoke.test.mjs", "cross-cutting.test.mjs", "unit.js"];
  expect(findOrphanTestViolations(files, new Set(["known.test.mjs"]))).toEqual(["orphan.test.mjs"]);
});

test("accepts registered test files and an empty collection", () => {
  expect(findOrphanTestViolations(["known.test.mjs"], new Set(["known.test.mjs"]))).toEqual([]);
  expect(findOrphanTestViolations([], new Set())).toEqual([]);
});

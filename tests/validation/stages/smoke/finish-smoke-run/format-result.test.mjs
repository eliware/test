import { expect, test } from "@jest/globals";
import {
  formatSmokeCleanupFailure,
  formatSmokeFinishResult,
} from "../../../../../src/validation/stages/smoke/finish-smoke-run/format-result.mjs";

test("formats successful restoration with and without cleanup details", () => {
  expect(formatSmokeFinishResult("Smoke passed.", undefined, "")).toBe(
    "Smoke passed. Previous target package state restored.",
  );
  expect(formatSmokeFinishResult("Smoke passed.", undefined, "Backup retained.")).toBe(
    "Smoke passed. Previous target package state restored. Backup retained.",
  );
});

test("formats restoration and cleanup failures", () => {
  expect(formatSmokeFinishResult("Smoke passed.", "target changed", "Backup retained.")).toBe(
    "Smoke passed. Target restoration failed: target changed. Backup retained.",
  );
  expect(formatSmokeCleanupFailure(new Error("cleanup denied"))).toBe(
    "Temporary smoke cleanup failed: cleanup denied.",
  );
});

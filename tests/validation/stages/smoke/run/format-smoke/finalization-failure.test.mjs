import { expect, test } from "@jest/globals";
import { formatSmokeFinalizationFailure } from "../../../../../../src/validation/stages/smoke/run/format-smoke/finalization-failure.mjs";

test("keeps the original result and names retained recovery data", () => {
  expect(
    formatSmokeFinalizationFailure("Smoke passed.", new Error("restore failed"), "temp-root"),
  ).toBe(
    "Smoke passed. Smoke finalization failed: restore failed. Recovery data may remain at temp-root.",
  );
});

test("reports a missing outcome and non-Error failure without a recovery path", () => {
  expect(formatSmokeFinalizationFailure(undefined, "cleanup failed", undefined)).toBe(
    "Tarball consumer smoke failed. Smoke finalization failed: cleanup failed.",
  );
});

import { expect, test } from "@jest/globals";
import { validateReleaseVersionHistory } from "../../../../src/checks/application/E-0.1.4.1.4/validate-release-version-history.mjs";

test("accepts descending SemVer entries with matching package version", () => {
  expect(
    validateReleaseVersionHistory(["## 12.1.0 — 2026-06-01", "## 12.0.0 — 2026-05-01"], "12.1.0"),
  ).toEqual([]);
});

test("rejects malformed entries and missing package versions", () => {
  expect(
    validateReleaseVersionHistory(["## 01.0.0 — 2026-01-01", "## invalid"], undefined),
  ).toEqual([
    "package.json.version is required for release-note validation.",
    "Malformed release entry: ## 01.0.0 — 2026-01-01.",
    "Malformed release entry: ## invalid.",
  ]);
});

test("requires the newest release to match the package version", () => {
  expect(validateReleaseVersionHistory(["## 12.1.0 — 2026-06-01"], "12.0.0")).toContain(
    "Newest release version 12.1.0 must match package.json.version 12.0.0.",
  );
});

test("rejects invalid dates and duplicate versions", () => {
  const errors = validateReleaseVersionHistory(
    ["## 12.0.0 — 2026-02-30", "## 12.0.0 — 2026-03-01"],
    "12.0.0",
  );
  expect(errors).toContain("Release date is invalid: 2026-02-30.");
  expect(errors).toContain("RELEASE_NOTES.md must not duplicate release versions.");
  expect(errors).toContain("Release versions must be in strictly descending SemVer order.");
  expect(errors).toContain("Release dates must not increase.");
});

test("rejects increasing version and date order", () => {
  const errors = validateReleaseVersionHistory(
    ["## 12.0.0 — 2026-01-01", "## 13.0.0 — 2026-02-01"],
    "12.0.0",
  );
  expect(errors).toContain("Release versions must be in strictly descending SemVer order.");
  expect(errors).toContain("Release dates must not increase.");
});

test("handles an empty version history", () => {
  expect(validateReleaseVersionHistory([], "12.0.0")).toEqual([]);
});

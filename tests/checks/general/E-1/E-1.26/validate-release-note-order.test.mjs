import { expect, test } from "@jest/globals";
import { validateReleaseNoteOrder } from "../../../../../src/checks/general/E-1/E-1.26/validate-release-note-order.mjs";

const entry = (version, date) => ({ type: "version", version, date });

test("accepts descending SemVer and dates, including releases on the same date", () => {
  expect(
    validateReleaseNoteOrder([
      { type: "unreleased" },
      entry("2.1.0", "2026-09-03"),
      entry("2.0.0", "2026-09-03"),
      entry("1.9.9", "2026-09-01"),
    ]),
  ).toBeNull();
});

test("rejects version headings that are not in strictly descending SemVer order", () => {
  expect(
    validateReleaseNoteOrder([entry("1.0.0", "2026-09-03"), entry("2.0.0", "2026-09-02")]),
  ).toContain("strictly descending SemVer");
  expect(
    validateReleaseNoteOrder([entry("2.0.0", "2026-09-03"), entry("2.0.0", "2026-09-02")]),
  ).toContain("strictly descending SemVer");
});

test("rejects release dates that are not in reverse chronological order", () => {
  expect(
    validateReleaseNoteOrder([entry("2.0.0", "2026-09-01"), entry("1.0.0", "2026-09-02")]),
  ).toContain("reverse chronological");
});

test("requires Unreleased to occur at most once and before versioned entries", () => {
  expect(
    validateReleaseNoteOrder([entry("1.0.0", "2026-09-01"), { type: "unreleased" }]),
  ).toContain("before all versioned");
  expect(validateReleaseNoteOrder([{ type: "unreleased" }, { type: "unreleased" }])).toContain(
    "at most one Unreleased",
  );
});

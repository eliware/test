import { expect, test } from "@jest/globals";
import validateReleaseNotesBody from "../../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/content/body.mjs";
test("checks release sections and version history", () => {
  expect(
    validateReleaseNotesBody(
      "# Release Notes\n\n## 1.0.0 — 2026-01-01\n\n### Added\n\nNew feature.\n",
      "1.0.0",
    ),
  ).toEqual([]);
});
test("requires a versioned release entry", () => {
  expect(validateReleaseNotesBody("No release entries.", "1.0.0")).toContain(
    "RELEASE_NOTES.md must contain at least one versioned release entry.",
  );
});

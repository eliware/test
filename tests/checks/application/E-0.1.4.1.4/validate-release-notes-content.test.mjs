import { expect, test } from "@jest/globals";
import { validateReleaseNotesContent } from "../../../../src/checks/application/E-0.1.4.1.4/validate-release-notes-content.mjs";

const valid =
  "# Release Notes\n\n## Unreleased\n\n### Changed\n\nPending.\n\n## 12.1.0 — 2026-06-01\n\n### Added\n\nNew feature.\n\n## 12.0.0 — 2026-05-01\n\n### Fixed\n\nBug fix.\n";

test("accepts valid release entries in descending order", () => {
  expect(validateReleaseNotesContent(valid)).toEqual([]);
});

test("rejects title, Unreleased order, and duplicate Unreleased sections", () => {
  const errors = validateReleaseNotesContent(
    "# Notes\n\n## 1.0.0 — 2026-01-01\n\n## Unreleased\n\n## Unreleased\n\n## 1.0.0\n",
  );
  expect(errors.join("\n")).toContain("must begin with # Release Notes");
  expect(errors.join("\n")).toContain("before versioned entries");
  expect(errors.join("\n")).toContain("at most one Unreleased");
  expect(errors.join("\n")).toContain("Malformed release entry");
});

test("rejects invalid dates, duplicate versions, and increasing versions or dates", () => {
  const notes =
    "# Release Notes\n\n## 12.0.0 — 2026-02-30\n\n### Added\n\nA.\n\n## 12.0.0 — 2026-03-01\n\n### Added\n\nB.\n\n## 13.0.0 — 2026-04-01\n\n### Added\n\nC.\n";
  const errors = validateReleaseNotesContent(notes).join("\n");
  expect(errors).toContain("Release date is invalid");
  expect(errors).toContain("must not duplicate release versions");
  expect(errors).toContain("strictly descending SemVer order");
  expect(errors).toContain("dates must not increase");
});

test("requires known, nonempty subsections", () => {
  const notes =
    "# Release Notes\n\n## Unreleased\n\n## 1.0.0 — 2026-01-01\n\n### Unknown\n\n## 0.9.0 — 2025-12-01\n";
  const errors = validateReleaseNotesContent(notes).join("\n");
  expect(errors).toContain("nonempty release subsection");
  expect(errors).toContain("unsupported subsection: Unknown");
  expect(errors).toContain("subsection Unknown must contain text");
});

test("does not count a nested heading as subsection content", () => {
  const notes = "# Release Notes\n\n## Unreleased\n\n### Changed\n\n#### Nested only\n";
  expect(validateReleaseNotesContent(notes).join(" ")).toContain(
    "subsection Changed must contain text",
  );
});

test("requires an entry and rejects SemVer leading zeroes", () => {
  expect(validateReleaseNotesContent("# Release Notes")).toContain(
    "RELEASE_NOTES.md must contain an Unreleased or versioned entry.",
  );
  expect(
    validateReleaseNotesContent(
      "# Release Notes\n\n## 01.0.0 — 2026-01-01\n\n### Added\n\nItem.\n",
    ),
  ).toContain("Malformed release entry: ## 01.0.0 — 2026-01-01.");
});

test("rejects more than one level-one title", () => {
  expect(validateReleaseNotesContent("# Release Notes\n\n# Extra\n\n## Unreleased\n")).toContain(
    "RELEASE_NOTES.md must contain one level-one title.",
  );
});

test("does not count release entries inside code fences", () => {
  const code = "# Release Notes\n\n```md\n## Unreleased\n\n### Added\n\nExample.\n```";
  expect(validateReleaseNotesContent(code)).toContain(
    "RELEASE_NOTES.md must contain an Unreleased or versioned entry.",
  );
});

test("requires the release title before code blocks", () => {
  expect(validateReleaseNotesContent("```text\nexample\n```\n" + valid)).toContain(
    "RELEASE_NOTES.md must begin with # Release Notes.",
  );
});

import { expect, test } from "@jest/globals";
import { validateReleaseNotesContent } from "../../../../src/checks/application/E-0.1.4.1.4/validate-release-notes-content.mjs";

const valid =
  "# Release Notes\n\n## Unreleased\n\n### Changed\n\nPending.\n\n## 12.1.0 — 2026-06-01\n\n### Added\n\nNew feature.\n\n## 12.0.0 — 2026-05-01\n\n### Fixed\n\nBug fix.\n";
const validate = (content) => validateReleaseNotesContent(content, "12.1.0");

test("accepts valid release entries in descending order", () => {
  expect(validate(valid)).toEqual([]);
});

test("accepts a UTF-8 byte-order mark before the title", () => {
  expect(validate(`\uFEFF${valid}`)).toEqual([]);
});

test("rejects title, Unreleased order, and duplicate Unreleased sections", () => {
  const errors = validate(
    "# Notes\n\n## 1.0.0 — 2026-01-01\n\n## Unreleased\n\n## Unreleased\n\n## 1.0.0\n",
  );
  expect(errors.join("\n")).toContain("must begin with # Release Notes");
  expect(errors.join("\n")).toContain("before versioned entries");
  expect(errors.join("\n")).toContain("at most one Unreleased");
  expect(errors.join("\n")).toContain("Malformed release entry");
});

test("requires known, nonempty subsections", () => {
  const notes =
    "# Release Notes\n\n## Unreleased\n\n## 1.0.0 — 2026-01-01\n\n### Unknown\n\n## 0.9.0 — 2025-12-01\n";
  const errors = validate(notes).join("\n");
  expect(errors).toContain("must contain a release subsection");
  expect(errors).toContain("unsupported subsection: Unknown");
});

test("does not count a nested heading as subsection content", () => {
  const notes = "# Release Notes\n\n## 12.1.0 — 2026-06-01\n\n### Changed\n\n#### Nested only\n";
  expect(validate(notes).join(" ")).toContain(
    "subsection Changed must contain user-visible change text",
  );
});

test("requires a versioned entry", () => {
  expect(validate("# Release Notes")).toContain(
    "RELEASE_NOTES.md must contain at least one versioned release entry.",
  );
});

test("rejects more than one level-one title", () => {
  expect(validate("# Release Notes\n\n# Extra\n\n## Unreleased\n")).toContain(
    "RELEASE_NOTES.md must contain one level-one title.",
  );
});

test("does not count release entries inside code fences", () => {
  const code = "# Release Notes\n\n```md\n## Unreleased\n\n### Added\n\nExample.\n```";
  expect(validate(code)).toContain(
    "RELEASE_NOTES.md must contain an Unreleased or versioned entry.",
  );
});

test("requires the release title before code blocks", () => {
  expect(validate("```text\nexample\n```\n" + valid)).toContain(
    "RELEASE_NOTES.md must begin with # Release Notes.",
  );
});

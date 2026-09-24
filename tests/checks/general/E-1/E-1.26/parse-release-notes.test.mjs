import { expect, test } from "@jest/globals";
import { parseReleaseNotes } from "../../../../../src/checks/general/E-1/E-1.26/parse-release-notes.mjs";

test("parses an Unreleased section followed by dated releases and supported categories", () => {
  const result = parseReleaseNotes(
    "# Release Notes\n\n## Unreleased\n\n### Changed\n- Pending change\n\n## 2.0.0 — 2026-09-02\n\n### Added\n- New capability\n",
  );
  expect(result.error).toBeNull();
  expect(result.entries.map(({ type, version }) => [type, version])).toEqual([
    ["unreleased", undefined],
    ["version", "2.0.0"],
  ]);
});

test.each([
  ["wrong title", "# Release notes\n\n## 1.0.0 — 2026-09-01\n"],
  ["malformed version heading", "# Release Notes\n\n## 01.0.0 — 2026-09-01\n"],
  ["invalid calendar date", "# Release Notes\n\n## 1.0.0 — 2026-02-30\n"],
  ["unsupported category", "# Release Notes\n\n## 1.0.0 — 2026-09-01\n\n### Notes\n- Detail\n"],
  [
    "duplicate category",
    "# Release Notes\n\n## 1.0.0 — 2026-09-01\n\n### Added\n- One\n\n### Added\n- Two\n",
  ],
  ["text outside a category", "# Release Notes\n\n## 1.0.0 — 2026-09-01\n\nLoose text\n"],
  ["category outside a release", "# Release Notes\n\n### Added\n- Detail\n"],
  [
    "unsupported nested heading",
    "# Release Notes\n\n## 1.0.0 — 2026-09-01\n\n### Added\n- Detail\n\n#### Subheading\n",
  ],
  ["no release entry", "# Release Notes\n"],
])("rejects %s", (_label, notes) => {
  expect(parseReleaseNotes(notes).error).toEqual(expect.any(String));
});

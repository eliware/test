import { expect, test } from "@jest/globals";
import { validateReleaseNoteContent } from "../../../../../src/checks/general/E-0.1/E-0.1.26/validate-release-note-content.mjs";

const release = (version, categories) => ({ type: "version", version, categories });
const change = (name, ...content) => ({ name, content });

test("requires the current package version and at least one release entry", () => {
  expect(validateReleaseNoteContent([], "1.0.0")).toContain("at least one versioned");
  expect(
    validateReleaseNoteContent([release("1.0.0", [change("Added", "Feature")])], "2.0.0"),
  ).toContain("current package version as the newest");
  expect(
    validateReleaseNoteContent(
      [release("2.0.0", [change("Added", "Feature")]), release("1.0.0", [change("Fixed", "Fix")])],
      "1.0.0",
    ),
  ).toContain("current package version as the newest");
});

test("accepts any supported non-empty change category without requiring Added or Fixed", () => {
  expect(
    validateReleaseNoteContent(
      [release("1.0.0", [change("Breaking changes", "Removed legacy API")])],
      "1.0.0",
    ),
  ).toBeNull();
});

test("rejects entries without categories and categories without user-visible change text", () => {
  expect(validateReleaseNoteContent([release("1.0.0", [])], "1.0.0")).toContain(
    "at least one change category",
  );
  expect(validateReleaseNoteContent([release("1.0.0", [change("Fixed")])], "1.0.0")).toContain(
    "must give the Fixed category user-visible change text",
  );
  for (const content of ["   ", "**", "---", "### Details", "TBD", "TODO", "N/A", "No changes"]) {
    expect(
      validateReleaseNoteContent([release("1.0.0", [change("Fixed", content)])], "1.0.0"),
    ).toContain("user-visible change text");
  }
  expect(
    validateReleaseNoteContent(
      [{ type: "unreleased", categories: [] }, release("1.0.0", [change("Added", "Feature")])],
      "1.0.0",
    ),
  ).toContain("must give Unreleased");
});

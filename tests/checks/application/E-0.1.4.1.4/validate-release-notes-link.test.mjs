import { expect, test } from "@jest/globals";
import { validateReleaseNotesLink } from "../../../../src/checks/application/E-0.1.4.1.4/validate-release-notes-link.mjs";

test("requires a release link in the Usage section", () => {
  expect(validateReleaseNotesLink("## Other\n\n[notes](RELEASE_NOTES.md)")).toHaveLength(1);
  expect(
    validateReleaseNotesLink("## Usage\n\n[notes](./RELEASE_NOTES.md#v1)\n\n## Links\n"),
  ).toEqual([]);
});

test("rejects prose that names the release file without a Markdown link", () => {
  expect(validateReleaseNotesLink("## Usage\n\nSee RELEASE_NOTES.md")).toHaveLength(1);
});

test("does not count release links inside code fences", () => {
  expect(
    validateReleaseNotesLink("## Usage\n\n```md\n[notes](RELEASE_NOTES.md)\n```"),
  ).toHaveLength(1);
});

test("accepts a reference link to the release notes", () => {
  expect(
    validateReleaseNotesLink("## Usage\n\n[notes][release]\n\n[release]: RELEASE_NOTES.md"),
  ).toEqual([]);
});

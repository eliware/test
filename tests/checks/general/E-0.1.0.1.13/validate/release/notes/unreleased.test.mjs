import { expect, test } from "@jest/globals";
import { validateNoUnreleasedReleaseNotes } from "../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/unreleased.mjs";

test("rejects Unreleased in prose", () => {
  expect(validateNoUnreleasedReleaseNotes("# Release Notes\n\nUnreleased work.")).toEqual([
    "RELEASE_NOTES.md must not contain the word Unreleased.",
  ]);
});

test("ignores Unreleased inside Markdown code and a leading byte-order mark", () => {
  expect(
    validateNoUnreleasedReleaseNotes("\uFEFF# Release Notes\n\n```text\nUnreleased\n```"),
  ).toEqual([]);
});

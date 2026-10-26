import { expect, test } from "@jest/globals";
import { validateNoUnreleasedReleaseNotes } from "../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/unreleased.mjs";

test("rejects the word without regard to case", () => {
  expect(validateNoUnreleasedReleaseNotes("# Release Notes\n\nunreleased work.")).toEqual([
    "RELEASE_NOTES.md must not contain the word Unreleased.",
  ]);
});

test("does not match the word inside a longer word", () => {
  expect(validateNoUnreleasedReleaseNotes("# Release Notes\n\nNotUnreleased work.")).toEqual([]);
});

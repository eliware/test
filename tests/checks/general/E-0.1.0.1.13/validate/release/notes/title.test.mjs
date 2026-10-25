import { expect, test } from "@jest/globals";
import { validateReleaseNotesTitle } from "../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/title.mjs";

test("requires the exact title as the first line", () => {
  expect(validateReleaseNotesTitle("# Notes")).toContain(
    "RELEASE_NOTES.md must begin with # Release Notes.",
  );
  expect(validateReleaseNotesTitle("\n# Release Notes")).toContain(
    "RELEASE_NOTES.md must begin with # Release Notes.",
  );
  expect(validateReleaseNotesTitle("# Release Notes")).toEqual([]);
});

test("requires one level-one title outside code blocks", () => {
  expect(validateReleaseNotesTitle("# Release Notes\n\n# Extra")).toContain(
    "RELEASE_NOTES.md must contain one level-one title.",
  );
  expect(validateReleaseNotesTitle("# Release Notes\n\n```md\n# Example\n```")).toEqual([]);
});

test("rejects Unreleased in prose but ignores it in Markdown code", () => {
  expect(validateReleaseNotesTitle("# Release Notes\n\nUnreleased work.")).toContain(
    "RELEASE_NOTES.md must not contain the word Unreleased.",
  );
  expect(validateReleaseNotesTitle("# Release Notes\n\n```text\nUnreleased\n```")).toEqual([]);
});

test("allows a UTF-8 byte-order mark before the title", () => {
  expect(validateReleaseNotesTitle("\uFEFF# Release Notes")).toEqual([]);
});

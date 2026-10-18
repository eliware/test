import { expect, test } from "@jest/globals";
import { parseGitIndexEntries } from "../../../../../src/checks/general/E-0.1.0.1.8/parse-git-index/entries.mjs";

test("parses staged index entries with supported object IDs and stages", () => {
  expect(
    parseGitIndexEntries(
      `100644 ${"a".repeat(40)} 0\tfile\0` + `120000 ${"b".repeat(64)} 3\tlink\0`,
    ),
  ).toEqual([
    { mode: "100644", path: "file" },
    { mode: "120000", path: "link" },
  ]);
});

test("returns no records for empty output and rejects malformed records", () => {
  expect(parseGitIndexEntries("")).toEqual([]);
  expect(() => parseGitIndexEntries("invalid\0")).toThrow("invalid index entry");
});

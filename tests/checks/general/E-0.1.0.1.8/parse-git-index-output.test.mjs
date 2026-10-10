import { expect, test } from "@jest/globals";
import {
  parseGitIndexEntries,
  parseGitNulPaths,
} from "../../../../src/checks/general/E-0.1.0.1.8/parse-git-index-output.mjs";

test("parses empty and NUL-delimited string or buffer paths", () => {
  expect(parseGitNulPaths("")).toEqual([]);
  expect(parseGitNulPaths("one\0two\0")).toEqual(["one", "two"]);
  expect(parseGitNulPaths(Buffer.from("one\0"))).toEqual(["one"]);
});

test.each([null, "missing terminator", "\0", "/absolute\0", "C:/drive\0"])(
  "rejects invalid NUL-delimited path output: %s",
  (output) => {
    expect(() => parseGitNulPaths(output)).toThrow();
  },
);

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

test("rejects malformed staged index records", () => {
  expect(() => parseGitIndexEntries("invalid\0")).toThrow("invalid index entry");
});

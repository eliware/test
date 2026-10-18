import { expect, test } from "@jest/globals";
import { parseGitNulPaths } from "../../../../../src/checks/general/E-0.1.0.1.8/parse-git-index/paths.mjs";

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

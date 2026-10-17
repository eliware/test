import { expect, test } from "@jest/globals";
import { isSafeRelativePosixPath } from "../../../../src/validation/shared/path/is-safe-relative-posix-path.mjs";

test.each(["src/index.mjs", "docs/", "files/**/*.mjs"])("accepts safe relative path %s", (path) => {
  expect(isSafeRelativePosixPath(path)).toBe(true);
});

test.each(["", " src/file ", "../outside", "src/../outside", "/rooted", "C:/rooted", "src\\file"])(
  "rejects unsafe relative path %s",
  (path) => {
    expect(isSafeRelativePosixPath(path)).toBe(false);
  },
);

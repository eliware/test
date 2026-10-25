import { expect, test } from "@jest/globals";
import { getRepositoryPathStyle } from "../../../../../src/validation/shared/repository/normalize-repository/path-style.mjs";

test("selects Windows and POSIX styles from absolute paths", () => {
  expect(getRepositoryPathStyle("C:\\repo", "tests\\one.test.mjs")).toBe("windows");
  expect(getRepositoryPathStyle("/repo", "tests/one.test.mjs")).toBe("posix");
  expect(getRepositoryPathStyle("\\\\server\\share\\repo", "test.mjs")).toBe("windows");
});

test("rejects mixed absolute path styles", () => {
  expect(getRepositoryPathStyle("/repo", "C:/repo/test.mjs")).toBeNull();
  expect(getRepositoryPathStyle("C:/repo", "/repo/test.mjs")).toBeNull();
});

import { expect, test } from "@jest/globals";
import { normalizeRepositoryRelativePath } from "../../src/orchestration/normalize-repository-relative-path.mjs";

test("normalizes repository paths using POSIX separators", () => {
  expect(normalizeRepositoryRelativePath("tests/example.test.mjs", "/repo")).toBe(
    "tests/example.test.mjs",
  );
  expect(normalizeRepositoryRelativePath("/repo\\tests\\example.test.mjs", "/repo")).toBe(
    "tests/example.test.mjs",
  );
  expect(normalizeRepositoryRelativePath("tests/example.test.mjs")).toBe("tests/example.test.mjs");
});

test("normalizes Windows paths on any host", () => {
  expect(normalizeRepositoryRelativePath("C:\\repo\\tests\\example.test.mjs", "C:/repo")).toBe(
    "tests/example.test.mjs",
  );
  expect(normalizeRepositoryRelativePath("tests/example.test.mjs", "C:\\repo")).toBe(
    "tests/example.test.mjs",
  );
  expect(
    normalizeRepositoryRelativePath("\\\\server\\share\\repo\\test.mjs", "\\\\server\\share\\repo"),
  ).toBe("test.mjs");
});

test("normalizes Windows separators with a relative repository root", () => {
  expect(normalizeRepositoryRelativePath("src\\test.mjs", "repo")).toBe("src/test.mjs");
});

test("marks paths outside the root or from another path style", () => {
  expect(normalizeRepositoryRelativePath("/other/test.mjs", "/repo")).toBe("[outside repository]");
  expect(normalizeRepositoryRelativePath("C:/other/test.mjs", "C:/repo")).toBe(
    "[outside repository]",
  );
  expect(normalizeRepositoryRelativePath("C:/repo/test.mjs", "/repo")).toBe("[outside repository]");
  expect(normalizeRepositoryRelativePath("/repo/test.mjs", "C:/repo")).toBe("[outside repository]");
});

test("handles missing paths", () => {
  expect(normalizeRepositoryRelativePath(null, "/repo")).toBe("unknown");
  expect(normalizeRepositoryRelativePath("", "/repo")).toBe("unknown");
  expect(normalizeRepositoryRelativePath("test.mjs", "")).toBe("[outside repository]");
});

import { expect, test } from "@jest/globals";
import { dirname, join, resolve } from "node:path";
import {
  escapesRepositoryRoot,
  isPathOutsideRoot,
  resolveLocalMarkdownReference,
} from "../../../../../src/checks/general/E-0.1.0.1.4/resolve/local-reference.mjs";

const root = resolve("repo");

test("resolves relative paths and removes query text from the target", () => {
  const result = resolveLocalMarkdownReference(root, "docs/index.md", "target.md?view=full#start");
  expect(result).toEqual({
    target: join(root, "docs", "target.md"),
    fragment: "start",
    escapesRoot: false,
  });
});

test("uses the source file when a reference contains only a fragment", () => {
  expect(resolveLocalMarkdownReference(root, "docs/index.md", "#section")).toEqual({
    target: join(root, "docs", "index.md"),
    fragment: "section",
    escapesRoot: false,
  });
});

test.each([
  ["..", true],
  ["../outside.md", true],
  ["C:/outside.md", true],
  ["/outside.md", true],
  ["docs/target.md", false],
])("classifies repository-relative paths %s", (path, expected) => {
  expect(escapesRepositoryRoot(path)).toBe(expected);
});

test("detects a resolved target outside the repository", () => {
  expect(isPathOutsideRoot(root, dirname(root))).toBe(true);
});

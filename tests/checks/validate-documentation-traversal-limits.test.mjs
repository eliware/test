import { expect, test } from "@jest/globals";
import {
  assertDocumentationFileLimit,
  validateDocumentationTraversalLimits,
} from "../../src/checks/validate-documentation-traversal-limits.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;
const validate = (records, overrides = {}) =>
  validateDocumentationTraversalLimits(records, {
    base: "docs",
    prefix: "docs/",
    maxDepth: 1,
    maxFiles: 10,
    fileCount: 0,
    includeGenerated: false,
    generatedPath,
    ...overrides,
  });

test("enforces the file count limit", () => {
  expect(() => assertDocumentationFileLimit(2, 1)).toThrow("1-file limit");
  expect(() => assertDocumentationFileLimit(1, 1)).not.toThrow();
});

test("measures directory and file depth relative to the requested scope", () => {
  expect(() =>
    validate([
      { path: "docs", type: "directory" },
      { path: "docs/one", type: "directory" },
      { path: "docs/one/index.md", type: "file" },
    ]),
  ).not.toThrow();
  expect(() =>
    validate([{ path: "docs", type: "directory" }], { base: "", prefix: "" }),
  ).not.toThrow();
  expect(() =>
    validate([
      { path: "docs", type: "directory" },
      { path: "docs/one/two", type: "directory" },
    ]),
  ).toThrow("depth limit");
  expect(() =>
    validate([
      { path: "docs", type: "directory" },
      { path: "docs/one/two/file.md", type: "file" },
    ]),
  ).toThrow("depth limit");
});

test("applies file counts and depth limits only to the configured scope", () => {
  expect(() =>
    validate(
      [
        { path: "docs", type: "directory" },
        { path: "outside/deep/index.md", type: "file" },
        { path: "docs/build/deep/index.md", type: "file" },
      ],
      { fileCount: 2, maxFiles: 2 },
    ),
  ).not.toThrow();
  expect(() => validate([], { fileCount: 2, maxFiles: 1 })).toThrow("file limit");
  expect(() => validate([{ path: "docs/build", type: "directory" }])).not.toThrow();
  expect(() =>
    validate([{ path: "docs/build", type: "directory" }], { includeGenerated: true }),
  ).not.toThrow();
  expect(() =>
    validate([{ path: "docs/build/deep/index.md", type: "file" }], { includeGenerated: true }),
  ).toThrow("depth limit");
});

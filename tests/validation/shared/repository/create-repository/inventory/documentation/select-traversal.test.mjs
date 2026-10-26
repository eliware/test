import { expect, test } from "@jest/globals";
import { createDocumentationTraversalSelection } from "../../../../../../../src/validation/shared/repository/create-repository/inventory/documentation/select-traversal.mjs";

function createSelection(overrides = {}) {
  return createDocumentationTraversalSelection({
    base: "docs",
    prefix: "docs/",
    predicate: () => true,
    maxDepth: 5,
    maxFiles: 10,
    includeGenerated: false,
    directory: "/repo/docs",
    ...overrides,
  });
}

test("selects callback-matched files and skips excluded paths", () => {
  const selection = createSelection({ predicate: (name) => name.endsWith(".md") });
  for (const path of [
    "docs/guide.md",
    "docs/notes.txt",
    "docs/build/generated.md",
    "docs/node_modules/dependency.md",
    "docs/test-results/result.md",
  ])
    selection.onFile(path);
  expect(selection.maxDepthFilter("docs/guide.md")).toBe(true);
  expect(selection.maxDepthFilter("docs/dist/generated.md")).toBe(false);
  expect(
    selection.select([
      { path: "docs", type: "directory" },
      { path: "docs/guide.md", type: "file" },
      { path: "docs/notes.txt", type: "file" },
      { path: "docs/build/generated.md", type: "file" },
      { path: "docs/node_modules/dependency.md", type: "file" },
    ]),
  ).toEqual(["guide.md"]);
});

test("uses records when traversal does not report callbacks", () => {
  const selection = createSelection({ predicate: (name) => name.endsWith(".md") });
  expect(
    selection.select([
      { path: "docs", type: "directory" },
      { path: "docs/guide.md", type: "file" },
      { path: "docs/notes.txt", type: "file" },
    ]),
  ).toEqual(["guide.md"]);
});

test("includes generated paths when requested", () => {
  const selection = createSelection({ includeGenerated: true });
  selection.onFile("docs/build/generated.md");
  expect(selection.maxDepthFilter("docs/build/generated.md")).toBe(true);
  expect(
    selection.select([
      { path: "docs", type: "directory" },
      { path: "docs/build", type: "directory" },
      { path: "docs/build/generated.md", type: "file" },
    ]),
  ).toEqual(["build/generated.md"]);
});

test("reports missing directories and traversal limits", () => {
  expect(() => createSelection().select([])).toThrow("ENOENT");
  const depthLimited = createSelection({ maxDepth: 0 });
  expect(() =>
    depthLimited.select([
      { path: "docs", type: "directory" },
      { path: "docs/nested", type: "directory" },
    ]),
  ).toThrow("depth limit");
});

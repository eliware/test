import { expect, test } from "@jest/globals";
import selectDocumentationTraversalResults from "../../../../../../../../src/validation/shared/repository/create-repository/inventory/documentation/select/traversal-results.mjs";

function select(records, overrides = {}) {
  return selectDocumentationTraversalResults({
    records,
    base: "docs",
    prefix: "docs/",
    predicate: (name) => name.endsWith(".md"),
    maxDepth: 5,
    maxFiles: 10,
    includeGenerated: false,
    directory: "/repo/docs",
    tracker: {
      traversalObserved: false,
      visitedFiles: 0,
      hasSelectedPath: () => false,
    },
    ...overrides,
  });
}

test("selects matching documentation files after confirming the directory", () => {
  expect(
    select([
      { path: "docs", type: "directory" },
      { path: "docs/guide.md", type: "file" },
      { path: "docs/readme.txt", type: "file" },
    ]),
  ).toEqual(["guide.md"]);
});

test("reports a missing documentation directory", () => {
  expect(() => select([])).toThrow("ENOENT");
});

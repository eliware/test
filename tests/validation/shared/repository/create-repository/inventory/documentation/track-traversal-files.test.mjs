import { expect, test } from "@jest/globals";
import { createDocumentationTraversalFileTracker } from "../../../../../../../src/validation/shared/repository/create-repository/inventory/documentation/track-traversal-files.mjs";

function createTracker(overrides = {}) {
  return createDocumentationTraversalFileTracker({
    prefix: "docs/",
    predicate: (name) => name.endsWith(".md"),
    maxFiles: 10,
    includeGenerated: false,
    ...overrides,
  });
}

test("tracks matching paths and visited files", () => {
  const tracker = createTracker();
  tracker.onFile("docs/guide.md");
  tracker.onFile("docs/notes.txt");
  expect(tracker.traversalObserved).toBe(true);
  expect(tracker.visitedFiles).toBe(2);
  expect(tracker.hasSelectedPath("docs/guide.md")).toBe(true);
  expect(tracker.hasSelectedPath("docs/notes.txt")).toBe(false);
});

test("ignores skipped paths and applies the file limit", () => {
  const tracker = createTracker({ maxFiles: 1 });
  tracker.onFile("docs/build/generated.md");
  expect(tracker.visitedFiles).toBe(0);
  tracker.onFile("docs/one.md");
  expect(() => tracker.onFile("docs/two.txt")).toThrow("file limit");
});

import { expect, test } from "@jest/globals";
import { matchesDocumentationFilename } from "../../src/orchestration/match-documentation-filename.mjs";

test("returns the filename predicate result", () => {
  expect(matchesDocumentationFilename((name) => name.endsWith(".md"), "README.md")).toBe(true);
  expect(matchesDocumentationFilename(() => false, "README.md")).toBe(false);
});

test("wraps predicate errors with the affected filename", () => {
  expect(() =>
    matchesDocumentationFilename(() => {
      throw new Error("bad predicate");
    }, "README.md"),
  ).toThrow('Documentation filename predicate failed for "README.md": bad predicate');
  expect(() =>
    matchesDocumentationFilename(() => {
      throw Symbol("invalid");
    }, "index.md"),
  ).toThrow('Documentation filename predicate failed for "index.md": Symbol(invalid)');
});

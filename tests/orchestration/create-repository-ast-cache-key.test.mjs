import { expect, test } from "@jest/globals";
import { createRepositoryAstCacheKey } from "../../src/orchestration/create-repository-ast-cache-key.mjs";

test("canonicalizes parser option property order in cache keys", () => {
  expect(
    createRepositoryAstCacheKey("/repo", "src/example.ts", {
      sourceType: "module",
      allowAwaitOutsideFunction: true,
    }),
  ).toBe(
    createRepositoryAstCacheKey("/repo", "src/example.ts", {
      allowAwaitOutsideFunction: true,
      sourceType: "module",
    }),
  );
});

test("keeps repository paths and parser configurations distinct", () => {
  const base = createRepositoryAstCacheKey("/repo", "src/a.ts", { sourceType: "module" });
  expect(base).not.toBe(createRepositoryAstCacheKey("/repo", "src/b.ts", { sourceType: "module" }));
  expect(base).not.toBe(
    createRepositoryAstCacheKey("/repo", "src/a.ts", { sourceType: "unambiguous" }),
  );
});

test("marks unsupported parser options as uncacheable", () => {
  expect(
    createRepositoryAstCacheKey("/repo", "src/example.ts", {
      plugins: new Map([["typescript", true]]),
    }),
  ).toBeNull();
});

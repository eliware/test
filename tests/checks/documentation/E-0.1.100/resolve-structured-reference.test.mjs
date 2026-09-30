import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { resolveStructuredReference } from "../../../../src/checks/documentation/E-0.1.100/resolve-structured-reference.mjs";

test("resolves local targets and skips non-file references", () => {
  const root = resolve("workspace", "repo");
  const file = resolve(root, "specs", "directives.json");
  expect(resolveStructuredReference(root, file, "./target.json#id=target")).toEqual({
    target: resolve(root, "specs", "target.json"),
  });
  expect(resolveStructuredReference(root, file, "/README.md")).toEqual({
    target: resolve(root, "README.md"),
  });
  expect(resolveStructuredReference(root, file, "https://example.test/reference.json")).toBeNull();
  expect(resolveStructuredReference(root, file, "#section")).toBeNull();
});

test("rejects paths that escape the repository", () => {
  const root = resolve("workspace", "repo");
  const file = resolve(root, "specs", "directives.json");
  expect(() => resolveStructuredReference(root, file, "../../docs/README.md")).toThrow(
    "resolves outside the repository",
  );
});

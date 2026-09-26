import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import {
  isWithinRegisteredRepository,
  resolveStructuredReference,
} from "../../../../src/checks/documentation/E-0.1.100/resolve-structured-reference.mjs";

test("resolves relative and root-relative local targets and skips non-file references", () => {
  const root = resolve("workspace", "repo");
  const file = resolve(root, "specs", "authority.json");
  expect(resolveStructuredReference(root, file, "./target.json#id=target", false)).toEqual({
    target: resolve(root, "specs", "target.json"), external: false,
  });
  expect(resolveStructuredReference(root, file, "/README.md", false)).toEqual({
    target: resolve(root, "README.md"), external: false,
  });
  expect(resolveStructuredReference(root, file, "https://example.test/authority.json", false)).toBeNull();
  expect(resolveStructuredReference(root, file, "#section", false)).toBeNull();
});

test("permits declared external references and rejects undeclared repository escapes", () => {
  const root = resolve("workspace", "repo");
  const file = resolve(root, "specs", "authority.json");
  const external = resolveStructuredReference(root, file, "../../docs/authority-map.json", true);
  expect(external).toEqual({ target: resolve(root, "..", "docs", "authority-map.json"), external: true });
  expect(() => resolveStructuredReference(root, file, "../../docs/authority-map.json", false)).toThrow(
    "resolves outside the repository",
  );
  expect(isWithinRegisteredRepository(resolve(external.target, "sub", "file.json"), external.target)).toBe(true);
  expect(isWithinRegisteredRepository(external.target, resolve(root, "..", "other"))).toBe(false);
});

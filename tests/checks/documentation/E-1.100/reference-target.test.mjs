import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { referenceTarget } from "../../../../src/checks/documentation/E-1.100/reference-target.mjs";

test("rejects invalid authority reference shapes", () => {
  const root = resolve("fixture-repo");
  const file = resolve("fixture-repo", "authority.json");
  for (const reference of [undefined, "", " target.json", "C:\\other.json", "\\\\server\\share", "https://example.test"]) {
    expect(referenceTarget(root, file, reference).error).toMatch(/repository-relative|nonempty/);
  }
  expect(referenceTarget(root, file, "./target.json#section")).toEqual({ target: resolve("fixture-repo", "target.json"), external: false });
});

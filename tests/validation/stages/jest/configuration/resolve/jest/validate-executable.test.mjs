import { expect, test } from "@jest/globals";
import { join, resolve } from "node:path";
import validateJestExecutable from "../../../../../../../src/validation/stages/jest/configuration/resolve/jest/validate-executable.mjs";
test("accepts a file inside the package directory", () => {
  const root = process.cwd();
  expect(validateJestExecutable(root, join(root, "package.json"))).toBe(true);
});
test("rejects an executable outside the package directory", () => {
  const root = process.cwd();
  expect(() => validateJestExecutable(root, resolve(root, "..", "outside"))).toThrow(
    "escapes its package directory",
  );
});

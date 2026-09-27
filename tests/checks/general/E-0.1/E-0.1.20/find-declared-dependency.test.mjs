import { expect, test } from "@jest/globals";
import { findDeclaredDependency } from "../../../../../src/checks/general/E-0.1/E-0.1.20/find-declared-dependency.mjs";

test("matches exact declared packages and their subpaths", () => {
  expect(findDeclaredDependency("alpha", ["alpha", "beta"])).toBe("alpha");
  expect(findDeclaredDependency("beta/feature", ["alpha", "beta"])).toBe("beta");
});

test("ignores unrelated or non-string specifiers", () => {
  expect(findDeclaredDependency("alphabet", ["alpha"])).toBeUndefined();
  expect(findDeclaredDependency(undefined, ["alpha"])).toBeUndefined();
});

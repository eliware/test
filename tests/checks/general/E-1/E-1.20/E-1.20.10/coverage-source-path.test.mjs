import { expect, test } from "@jest/globals";
import { isInScopeSource, normalizeSourcePath } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-source-path.mjs";

test("recognizes supported source files under relative and absolute src roots", () => {
  expect(isInScopeSource("src/app.mjs")).toBe(true);
  expect(isInScopeSource("C:\\repo\\src\\app.js")).toBe(true);
  expect(isInScopeSource("/repo/src/app.cjs")).toBe(true);
});

test("excludes paths outside src, unsupported extensions, and non-production subtrees", () => {
  for (const file of ["README.md", "tests/app.mjs", "src/README.txt", "src/tests/app.mjs", "src/fixture/app.mjs", "src/generated/app.mjs", "src/dist/app.mjs", "src/build/app.mjs"]) {
    expect(isInScopeSource(file)).toBe(false);
  }
});

test("normalizes relative and absolute source paths", () => {
  expect(normalizeSourcePath("./src/app.mjs")).toBe("src/app.mjs");
  expect(normalizeSourcePath("C:\\repo\\src\\app.mjs")).toBe("src/app.mjs");
  expect(normalizeSourcePath("tests/app.mjs")).toBe("tests/app.mjs");
});

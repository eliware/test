import { expect, test } from "@jest/globals";
import { resolveFocusedScope } from "../../src/cli/resolve-focused-scope.mjs";

test("maps a focused test to its normalized source/test pair", () => {
  expect(resolveFocusedScope(["--runInBand", "tests\\cli\\example.test.mjs"])).toEqual({
    testPath: "tests/cli/example.test.mjs",
    sourcePath: "src/cli/example.mjs",
    paths: ["tests/cli/example.test.mjs", "src/cli/example.mjs"],
  });
});

test("returns no scope without a focused test path", () => {
  expect(resolveFocusedScope(["--runInBand"])).toBeNull();
  expect(resolveFocusedScope()).toBeNull();
});

test("returns no scope for a non-test positional path", () => {
  expect(resolveFocusedScope(["src/cli/example.mjs"])).toBeNull();
});

test("does not create a scope for specification paths", () => {
  expect(resolveFocusedScope(["specs/cli/example.spec.mjs"])).toBeNull();
});

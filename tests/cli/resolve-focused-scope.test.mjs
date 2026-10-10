import { expect, test } from "@jest/globals";
import { resolveFocusedScope } from "../../src/cli/resolve-focused-scope.mjs";

test("maps a focused test to its normalized source/test pair", () => {
  expect(resolveFocusedScope(["--runInBand", "tests\\cli\\example.test.mjs"])).toEqual({
    testPath: "tests/cli/example.test.mjs",
    sourcePath: "src/cli/example.mjs",
    testPaths: ["tests/cli/example.test.mjs"],
    sourcePaths: ["src/cli/example.mjs"],
    paths: ["tests/cli/example.test.mjs", "src/cli/example.mjs"],
  });
});

test("maps multiple focused tests to all mirrored source paths", () => {
  expect(resolveFocusedScope(["tests/cli/one.test.mjs", "tests/runtime/two.spec.mjs"])).toEqual({
    testPath: "tests/cli/one.test.mjs",
    sourcePath: "src/cli/one.mjs",
    testPaths: ["tests/cli/one.test.mjs", "tests/runtime/two.spec.mjs"],
    sourcePaths: ["src/cli/one.mjs", "src/runtime/two.mjs"],
    paths: [
      "tests/cli/one.test.mjs",
      "tests/runtime/two.spec.mjs",
      "src/cli/one.mjs",
      "src/runtime/two.mjs",
    ],
  });
});

test("returns no scope without a focused test path", () => {
  expect(resolveFocusedScope(["--runInBand"])).toBeNull();
  expect(resolveFocusedScope()).toBeNull();
});

test("returns no scope for a non-test positional path", () => {
  expect(resolveFocusedScope(["src/cli/example.mjs"])).toBeNull();
  expect(resolveFocusedScope(["test/cli/example.test.mjs"])).toBeNull();
});

test("does not create a scope for specification paths", () => {
  expect(resolveFocusedScope(["specs/cli/example.spec.mjs"])).toBeNull();
  expect(resolveFocusedScope(["tests"])).toBeNull();
});

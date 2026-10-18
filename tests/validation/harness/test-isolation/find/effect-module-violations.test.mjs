import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findEffectModuleViolations } from "../../../../../src/validation/harness/test-isolation/find/effect-module-violations.mjs";

test("rejects unmocked file system and process modules", () => {
  const ast = parse('import * as fs from "node:fs"; const child = require("node:child_process");', {
    sourceType: "module",
  });
  expect(findEffectModuleViolations(ast)).toEqual([
    "must mock effect module node:fs or inject its dependency.",
    "must mock effect module node:child_process or inject its dependency.",
  ]);
});

test("accepts explicit Jest mocks for imported effect modules", () => {
  const ast = parse(
    'jest["unstable_mockModule"]("node:fs", () => ({})); const fs = await import("node:fs");',
    { sourceType: "module" },
  );
  expect(findEffectModuleViolations(ast)).toEqual([]);
});

test("requires an effective mock before a dynamic import", () => {
  const lateMock = parse(
    'const fs = await import("node:fs"); jest.unstable_mockModule("node:fs", () => ({}));',
    { sourceType: "module" },
  );
  expect(findEffectModuleViolations(lateMock)).toEqual([
    "must mock effect module node:fs or inject its dependency.",
  ]);
  const staticImport = parse(
    'jest.unstable_mockModule("node:fs", () => ({})); import { readFile } from "node:fs";',
    { sourceType: "module" },
  );
  expect(findEffectModuleViolations(staticImport)).toEqual([
    "must mock effect module node:fs or inject its dependency.",
  ]);
});

test("rejects a mock factory that imports the real effect module", () => {
  const ast = parse(
    'jest.mock("node:fs", () => jest.requireActual("node:fs")); const fs = await import("node:fs");',
    { sourceType: "module" },
  );
  expect(findEffectModuleViolations(ast)).toEqual([
    "must mock effect module node:fs or inject its dependency.",
  ]);
});

test("ignores non-effect modules and unknown dynamic module names", () => {
  const ast = parse(
    'import value from "../value.mjs"; import(moduleName); jest.mock(); jest["other"]("node:fs");',
    { sourceType: "module" },
  );
  expect(findEffectModuleViolations(ast)).toEqual([]);
});

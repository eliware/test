import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectModuleShadowedNames } from "../../../../src/checks/application/E-0.1.4.1.2/collect-module-shadowed-jest-names.mjs";

const jestNames = { callbacks: new Set(["test", "it", "check"]), namespaces: new Set(["api"]) };

test("finds module bindings that shadow Jest names", () => {
  const program = parse(
    'const test = () => {}; function it() {} import { run as api } from "other";',
    { sourceType: "module" },
  ).program;
  expect([...collectModuleShadowedNames(program, jestNames).tests].sort()).toEqual([
    "api",
    "it",
    "test",
  ]);
});

test("keeps Jest imports and test aliases active", () => {
  const program = parse(
    'import { test as check } from "@jest/globals"; const alias = test; const api = await import("@jest/globals");',
    { sourceType: "module" },
  ).program;
  expect([...collectModuleShadowedNames(program, jestNames).tests]).toEqual([]);
});

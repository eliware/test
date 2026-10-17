import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectModuleShadowedNames } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/module-shadowed-jest-names.mjs";

const jestNames = {
  callbacks: new Set(["test", "it", "check"]),
  namespaces: new Set(["api"]),
  describes: new Set(["describe"]),
};

test("finds module bindings that shadow Jest names", () => {
  const program = parse(
    'const test = () => {}; function it() {} const describe = () => {}; import { run as api } from "other";',
    { sourceType: "module" },
  ).program;
  expect([...collectModuleShadowedNames(program, jestNames).tests].sort()).toEqual([
    "api",
    "it",
    "test",
  ]);
  expect([...collectModuleShadowedNames(program, jestNames).describes]).toEqual(["describe"]);
});

test("keeps Jest imports and test aliases active", () => {
  const program = parse(
    'import { test as check } from "@jest/globals"; const alias = test; const api = await import("@jest/globals");',
    { sourceType: "module" },
  ).program;
  expect([...collectModuleShadowedNames(program, jestNames).tests]).toEqual([]);
});

test("finds shadowed global names and hoisted test variables", () => {
  const program = parse("var global = {}; var globalThis = {}; var test = () => {};", {
    sourceType: "module",
  }).program;
  const result = collectModuleShadowedNames(program, jestNames);
  expect(result.shadowedGlobals).toEqual(new Set(["global", "globalThis"]));
  expect(result.tests).toEqual(new Set(["test"]));
});

test("collects exported declarations and accepts exports without declarations", () => {
  const program = parse("export const it = () => {}; export function describe() {} export {};", {
    sourceType: "module",
  }).program;
  const result = collectModuleShadowedNames(program, jestNames);

  expect(result.tests).toEqual(new Set(["it"]));
  expect(result.describes).toEqual(new Set(["describe"]));
});

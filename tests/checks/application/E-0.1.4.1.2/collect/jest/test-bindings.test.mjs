import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJestTestNames } from "../../../../../../src/checks/application/E-0.1.4.1.2/collect/jest/test-bindings.mjs";

test("collects global, imported, namespace, and chained test aliases", () => {
  const program = parse(
    'import * as jestApi from "@jest/globals"; const first = test; const second = first; const third = jestApi.test;',
    { sourceType: "module" },
  ).program;
  const names = collectJestTestNames(program);
  expect(names.callbacks).toEqual(new Set(["test", "it", "first", "second", "third"]));
  expect(names.namespaces).toEqual(new Set(["jestApi"]));
});

test("ignores destructured names from a different namespace", () => {
  const program = parse("const { test: run } = other;", { sourceType: "module" }).program;
  expect(collectJestTestNames(program).callbacks).toEqual(new Set(["test", "it"]));
});

test("recognizes string-key aliases from a dynamic Jest import", () => {
  const program = parse('const { "test": run } = await import("@jest/globals");', {
    sourceType: "module",
  }).program;
  expect(collectJestTestNames(program).callbacks).toContain("run");
});

test("does not promote a test alias from an uninvoked function", () => {
  const program = parse(
    'import { test } from "@jest/globals"; function unused() { const fake = test; } fake("name", () => {});',
    { sourceType: "module" },
  ).program;
  expect(collectJestTestNames(program).callbacks).not.toContain("fake");
});

test("collects aliases inside executable Jest suite callbacks", () => {
  const program = parse(
    'import { test } from "@jest/globals"; describe("suite", () => { const run = test; run("name", () => {}); });',
    { sourceType: "module" },
  ).program;
  expect(collectJestTestNames(program).callbacks).toContain("run");
});

test("drops reassigned aliases and ignores unrelated Jest imports", () => {
  const program = parse(
    'import { test, describe } from "@jest/globals"; let run = test; run = custom; run("fake", () => {});',
    { sourceType: "module" },
  ).program;
  expect(collectJestTestNames(program).callbacks).not.toContain("run");
});

test("drops aliases after a dynamic Jest namespace changes", () => {
  const program = parse(
    'let api = await import("@jest/globals"); const { test: run } = api; api = {}; run("fake", () => {});',
    { sourceType: "module" },
  ).program;
  expect(collectJestTestNames(program).callbacks).not.toContain("run");
});

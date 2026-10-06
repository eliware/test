import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJestTestNames } from "../../../../src/checks/application/E-0.1.4.1.2/collect-jest-test-names.mjs";

test("collects global, imported, namespace, and chained test aliases", () => {
  const program = parse(
    'import * as jestApi from "@jest/globals"; const first = test; const second = first; const third = jestApi.test;',
    { sourceType: "module" },
  ).program;
  const names = collectJestTestNames(program);
  expect(names.callbacks).toEqual(new Set(["test", "it", "first", "second", "third"]));
  expect(names.namespaces).toEqual(new Set(["jestApi"]));
});

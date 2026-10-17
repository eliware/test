import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectStaticStrings } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/collect/static-strings.mjs";
import { collectCommandStrings } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/collect/command-strings.mjs";

test("collects static command strings from nested arguments", () => {
  const { program } = parse('const runner = "vitest"; spawn(runner, ["run"]);', {
    sourceType: "module",
  });
  const strings = collectStaticStrings(program);
  const call = program.body[1].expression;
  expect(collectCommandStrings(call.arguments, strings)).toEqual(["vitest", "run"]);
});

test("ignores dynamic command values", () => {
  const { program } = parse('spawn(dynamic, ["run"]);', { sourceType: "module" });
  expect(collectCommandStrings(program.body[0].expression.arguments, new Map())).toEqual(["run"]);
});

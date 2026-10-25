import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findProcessEffectViolations } from "../../../../../../src/validation/harness/test-isolation/find/network/process-effects.mjs";

const find = (source) => findProcessEffectViolations(parse(source));

test("rejects direct and computed process effects", () => {
  expect(find('process.exit(1); process["kill"](1);')).toEqual([
    "must mock process effects or inject the process dependency.",
  ]);
});

test("recognizes process object and method aliases", () => {
  expect(
    find("const runtime = process; const quit = process.exit; runtime.kill(1); quit(1);"),
  ).toEqual(["must mock process effects or inject the process dependency."]);
});

test("ignores calls that do not use a prohibited process method", () => {
  expect(find("process.cwd(); runtime.stop(); (() => {})();")).toEqual([]);
});

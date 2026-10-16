import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findClockEffectViolations } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-isolation/find/clock-effect-violations.mjs";

test("rejects real timers and dates without fake timers", () => {
  const ast = parse(
    'setTimeout(run, 5); setInterval(run, 5); new Date(); Date.now(); Date["now"]();',
  );
  expect(findClockEffectViolations(ast)).toEqual([
    "must use fake timers or inject a fixed clock for timer calls.",
    "must use fake timers or inject a fixed clock for date calls.",
  ]);
});

test("accepts timers and dates when the suite enables fake timers", () => {
  const ast = parse("setTimeout(run, 5); jest.useFakeTimers(); new Date(); Date.now();");
  expect(findClockEffectViolations(ast)).toEqual([]);
});

test("accepts controlled dates and injected timer methods", () => {
  const ast = parse("new Date(0); clock.setTimeout(run, 5);");
  expect(findClockEffectViolations(ast)).toEqual([]);
});

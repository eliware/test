import { expect, test } from "@jest/globals";
import { createStageTimer } from "../../../src/cli/timing/create-stage-timer.mjs";

test("records cumulative and since-previous-step timings", () => {
  let now = 1000;
  const timer = createStageTimer(true, () => now);
  now = 2500;
  timer.step("configuration", "checks");
  now = 4500;
  timer.step("checks", "complete");
  expect(timer.getLines()).toEqual([]);
  expect(timer.getJestOutput()).toBe("");
});

test("streams one live line per check", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(true, () => now, (text) => output.push(text));
  timer.start("E-1");
  now = 2500;
  timer.end("E-1");
  expect(output).toEqual(["[eliware-test] Running E-1...", " E-1 completed — 1.500s\n"]);
});

test("retains stage transitions for non-check orchestration timing", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(true, () => now, (text) => output.push(text));
  now = 2500;
  timer.step("configuration", "checks");
  expect(output).toEqual([" configuration completed — starting checks\n"]);
});

test("does not emit check timing when disabled", () => {
  const output = [];
  const timer = createStageTimer(false, () => 1000, (text) => output.push(text));
  timer.start("E-1");
  timer.step("E-1", "done");
  timer.end("E-1");
  expect(output).toEqual([]);
});

test("supports lazy Jest output without retaining a second copy", () => {
  const timer = createStageTimer(false);
  timer.setJestOutputGetter(() => "lazy-report");
  expect(timer.getJestOutput()).toBe("lazy-report");
  timer.setJestOutputGetter(null);
  expect(timer.getJestOutput()).toBe("");
});

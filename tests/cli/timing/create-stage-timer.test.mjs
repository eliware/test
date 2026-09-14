import { expect, test } from "@jest/globals";
import { createStageTimer } from "../../../src/cli/timing/create-stage-timer.mjs";

test("records cumulative and since-previous-step timings", () => {
  let now = 1000;
  const timer = createStageTimer(true, () => now);
  now = 2500;
  timer.step("configuration", "checks");
  now = 4500;
  timer.step("checks", "complete");
  expect(timer.getLines()).toEqual([
    "configuration completed, starting checks... (+1.500s total, +1.500s since last step)",
    "checks completed, starting complete... (+3.500s total, +2.000s since last step)",
  ]);
});

test("does not collect disabled timing and stores Jest output", () => {
  const timer = createStageTimer(false);
  timer.step("one", "two");
  timer.setJestOutput(42);
  expect(timer.getLines()).toEqual([]);
  expect(timer.getJestOutput()).toBe("");
});

test("keeps string Jest output", () => {
  const timer = createStageTimer(false);
  timer.setJestOutput("report");
  expect(timer.getJestOutput()).toBe("report");
});

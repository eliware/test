import { expect, test } from "@jest/globals";
import { createStageTimer } from "../../../../src/cli/timing/create/stage-timer.mjs";

test("writes separate start and completion lines for each check", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(
    true,
    () => now,
    (chunk) => output.push(chunk),
  );
  timer.start("E-0.1");
  now = 2500;
  timer.end("E-0.1");
  expect(output).toEqual(["[0.000s] E-0.1...\n", "[1.500s] E-0.1 completed - 1.500s\n"]);
  expect(output.join("")).toBe("[0.000s] E-0.1...\n[1.500s] E-0.1 completed - 1.500s\n");
});

test("step updates the timer without writing transition chatter", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(
    true,
    () => now,
    (chunk) => output.push(chunk),
  );
  timer.start("E-0.1");
  now = 1500;
  timer.step();
  now = 2500;
  timer.end("E-0.1");
  expect(output.join("")).toBe("[0.000s] E-0.1...\n[1.500s] E-0.1 completed - 1.000s\n");
});

test("tracks durations independently for concurrent checks", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(
    true,
    () => now,
    (chunk) => output.push(chunk),
    1000,
  );
  timer.start("E-first");
  now = 2000;
  timer.start("E-second");
  now = 3000;
  timer.end("E-first");
  now = 4000;
  timer.end("E-second");
  expect(output.join("")).toBe(
    "[0.000s] E-first...\n" +
      "[1.000s] E-second...\n" +
      "[2.000s] E-first completed - 2.000s\n" +
      "[3.000s] E-second completed - 2.000s\n",
  );
});

test("reports zero duration when a check ends without a start", () => {
  const output = [];
  const timer = createStageTimer(
    true,
    () => 1000,
    (chunk) => output.push(chunk),
  );
  timer.end("E-unstarted");
  expect(output).toEqual(["[0.000s] E-unstarted completed - 0.000s\n"]);
});

test("places nested output between the check start and completion lines", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(
    true,
    () => now,
    (chunk) => output.push(chunk),
  );
  timer.start("E-0.1.130.13");
  timer.beginNestedOutput();
  timer.beginNestedOutput();
  timer.writeNestedOutput("[0.000s] tests/example.test.mjs...");
  timer.writeNestedOutput(" PASS - 0.212s\n");
  now = 2000;
  timer.end("E-0.1.130.13");
  expect(output.join("")).toBe(
    "[0.000s] E-0.1.130.13...\n[0.000s] tests/example.test.mjs... PASS - 0.212s\n[1.000s] E-0.1.130.13 completed - 1.000s\n",
  );
});

test("closes an open nested line before the stage completion", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(
    true,
    () => now,
    (chunk) => output.push(chunk),
  );
  timer.start("E-0.1.130.13");
  timer.beginNestedOutput();
  timer.writeNestedOutput("[0.000s] tests/slow.test.mjs...");
  now = 2000;
  timer.end("E-0.1.130.13");
  expect(output.join("")).toBe(
    "[0.000s] E-0.1.130.13...\n[0.000s] tests/slow.test.mjs...\n[1.000s] E-0.1.130.13 completed - 1.000s\n",
  );
});

test("uses the default clock and writer adapters", () => {
  const disabled = createStageTimer();
  disabled.start("E-0.1");
  disabled.end("E-0.1");
  const enabled = createStageTimer(true, () => 1000);
  enabled.start("E-0.1");
  enabled.end("E-0.1");
});

test("does not emit check timing when disabled", () => {
  const output = [];
  const timer = createStageTimer(
    false,
    () => 1000,
    (chunk) => output.push(chunk),
  );
  timer.start("E-0.1");
  timer.beginNestedOutput();
  timer.writeNestedOutput("nested");
  timer.step();
  timer.stage("jest");
  timer.end("E-0.1");
  expect(output).toEqual([]);
});

test("reports checks skipped after a prerequisite failure", () => {
  const output = [];
  const timer = createStageTimer(
    true,
    () => 1000,
    (chunk) => output.push(chunk),
  );
  timer.skip("E-0.1.130.13");
  expect(output.join("")).toBe(
    "[0.000s] Skipping E-0.1.130.13 because a prerequisite check failed\n",
  );
});

test("writes elapsed stage markers", () => {
  let now = 1000;
  const output = [];
  const timer = createStageTimer(
    true,
    () => now,
    (chunk) => output.push(chunk),
  );
  now = 25_503;
  timer.stage("jest");
  expect(output).toEqual(["[24.503s] Stage: jest\n"]);
});

test("does not report skipped checks when timing is disabled", () => {
  const output = [];
  const timer = createStageTimer(
    false,
    () => 1000,
    (chunk) => output.push(chunk),
  );
  timer.skip("E-0.1.130.13");
  expect(output).toEqual([]);
});

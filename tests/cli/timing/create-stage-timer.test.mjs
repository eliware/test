import { expect, test } from "@jest/globals";
import { createStageTimer } from "../../../src/cli/timing/create-stage-timer.mjs";

test("writes each check as one line with start and completion streamed together", () => {
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
  expect(output).toEqual(["Running E-0.1...", " completed - 1.500s\n"]);
  expect(output.join("")).toBe("Running E-0.1... completed - 1.500s\n");
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
  expect(output.join("")).toBe("Running E-0.1... completed - 1.000s\n");
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
  timer.writeNestedOutput("Running tests/example.test.mjs...");
  timer.writeNestedOutput(" PASS - 0.212s\n");
  now = 2000;
  timer.end("E-0.1.130.13");
  expect(output.join("")).toBe(
    "Running E-0.1.130.13...\nRunning tests/example.test.mjs... PASS - 0.212s\nE-0.1.130.13 completed - 1.000s\n",
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
  timer.writeNestedOutput("Running tests/slow.test.mjs...");
  now = 2000;
  timer.end("E-0.1.130.13");
  expect(output.join("")).toBe(
    "Running E-0.1.130.13...\nRunning tests/slow.test.mjs...\nE-0.1.130.13 completed - 1.000s\n",
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
  timer.end("E-0.1");
  expect(output).toEqual([]);
});

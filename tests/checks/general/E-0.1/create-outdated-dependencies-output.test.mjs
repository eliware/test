import { expect, test } from "@jest/globals";
import { createOutdatedDependenciesOutput } from "../../../../src/checks/general/E-0.1/create-outdated-dependencies-output.mjs";

test("accumulates stdout only up to its limit", () => {
  const output = createOutdatedDependenciesOutput(5, 8);
  expect(output.appendStdout(Buffer.from("abc"))).toBe(true);
  expect(output.appendStdout(Buffer.from("de"))).toBe(true);
  expect(output.appendStdout(Buffer.from("f"))).toBe(false);
  expect(output.stdout).toBe("abcde");
});

test("retains a bounded stderr tail independently of stdout", () => {
  const output = createOutdatedDependenciesOutput(2, 5);
  output.appendStderr(Buffer.from("abc"));
  output.appendStderr(Buffer.from("def"));
  expect(output.stderr).toBe("bcdef");
  expect(output.appendStdout(Buffer.from("ok"))).toBe(true);
  expect(output.stdout).toBe("ok");
});

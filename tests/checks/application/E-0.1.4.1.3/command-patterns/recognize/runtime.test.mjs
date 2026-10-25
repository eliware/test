import { expect, test } from "@jest/globals";
import { isRuntimeTestCommand } from "../../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/recognize/runtime.mjs";

test("recognizes Node, Bun, and Deno test commands", () => {
  expect(isRuntimeTestCommand("node.exe --experimental-test-coverage --test")).toBe(true);
  expect(isRuntimeTestCommand("bun test src")).toBe(true);
  expect(isRuntimeTestCommand("deno test --allow-read")).toBe(true);
  expect(isRuntimeTestCommand("node --version")).toBe(false);
});

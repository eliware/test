import { expect, test } from "@jest/globals";
import {
  normalizeCommandPrefix,
  splitTestCommandChain,
} from "../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/parse-command.mjs";

test("splits command chains and trims each command", () => {
  expect(splitTestCommandChain("echo ready && jest --runInBand | mocha")).toEqual([
    "echo ready",
    "jest --runInBand",
    "mocha",
  ]);
});

test("keeps quoted chain operators inside command arguments", () => {
  expect(splitTestCommandChain(`echo 'safe | jest' && echo "safe || vitest"`)).toEqual([
    "echo 'safe | jest'",
    'echo "safe || vitest"',
  ]);
});

test("keeps escaped separators and splits an unquoted logical OR", () => {
  expect(
    splitTestCommandChain(String.raw`echo safe \| jest && echo "safe \" | vitest" || jest`),
  ).toEqual([String.raw`echo safe \| jest`, String.raw`echo "safe \" | vitest"`, "jest"]);
});

test("removes environment assignments and command prefixes", () => {
  expect(normalizeCommandPrefix("MODE=test command jest --runInBand")).toBe("jest --runInBand");
  expect(normalizeCommandPrefix("exec jest --runInBand")).toBe("jest --runInBand");
});

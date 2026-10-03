import { expect, test } from "@jest/globals";
import { createJestNodeOptions } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-node-options.mjs";

test("adds the required Jest Node options while preserving supported warning settings", () => {
  expect(createJestNodeOptions()).toBe("--experimental-vm-modules --no-warnings");
  expect(createJestNodeOptions(" --experimental-vm-modules --trace-warnings ")).toBe(
    "--experimental-vm-modules --trace-warnings",
  );
  expect(createJestNodeOptions("--trace-warnings")).toBe(
    "--trace-warnings --experimental-vm-modules",
  );
  expect(createJestNodeOptions("--trace-warnings=true")).toBe(
    "--trace-warnings=true --experimental-vm-modules",
  );
  expect(createJestNodeOptions("--trace-warnings=false")).toBe(
    "--trace-warnings=false --experimental-vm-modules",
  );
  expect(createJestNodeOptions("--no-warnings")).toBe("--no-warnings --experimental-vm-modules");
});

test("rejects inherited Node options that could alter or preload Jest execution", () => {
  for (const option of [
    "--require=./inject.mjs",
    "--import=./inject.mjs",
    "--inspect",
    "--trace-warnings=inject.mjs",
    "--trace-warnings ./inject.mjs",
    "--trace-warnings --require ./inject.mjs",
    '--trace-warnings="--import=./inject.mjs"',
    "--experimental-vm-modules\\",
  ]) {
    expect(() => createJestNodeOptions(option)).toThrow(
      "Unsupported inherited NODE_OPTIONS for the Jest validation process.",
    );
  }
});

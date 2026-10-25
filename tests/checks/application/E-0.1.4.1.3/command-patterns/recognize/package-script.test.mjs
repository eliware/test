import { expect, test } from "@jest/globals";
import {
  hasAlternativePackageScriptCommand,
  testToolRunners,
} from "../../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/recognize/package-script.mjs";

test("defines the shared test runner names", () => {
  expect(testToolRunners).toContain("jest");
  expect(testToolRunners).toContain("vitest");
  expect(Object.isFrozen(testToolRunners)).toBe(true);
});

test.each(["jest", "npm exec -- vitest run", "pnpm dlx mocha", "./node_modules/.bin/nyc jest"])(
  "recognizes shared test-tool command %s",
  (command) => {
    expect(hasAlternativePackageScriptCommand(command)).toBe(true);
  },
);

test.each(["node index.mjs", "echo hello", "npm test", "git status"])(
  "does not recognize unrelated command %s",
  (command) => {
    expect(hasAlternativePackageScriptCommand(command)).toBe(false);
  },
);

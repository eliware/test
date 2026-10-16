import { expect, test } from "@jest/globals";
import { hasAlternativeToolCommand } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/has-alternative-tool-command.mjs";

test.each([
  "jest",
  "npm exec -- vitest run",
  "pnpm dlx mocha",
  "node --test",
  "./node_modules/.bin/nyc jest",
])("finds alternative test command %s", (command) => {
  expect(hasAlternativeToolCommand(command)).toBe(true);
});

test.each(["node index.mjs", "echo hello", "npm test", "git status"])(
  "allows unrelated command %s",
  (command) => {
    expect(hasAlternativeToolCommand(command)).toBe(false);
  },
);

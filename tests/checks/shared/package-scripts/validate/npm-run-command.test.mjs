import { expect, test } from "@jest/globals";
import { validateNpmRunCommand } from "../../../../../src/checks/shared/package-scripts/validate/npm-run-command.mjs";

const label = "workflow validation step";

test("accepts a declared npm script", () => {
  expect(
    validateNpmRunCommand(
      "npm run preflight",
      { scripts: { preflight: "vyops preflight" } },
      label,
    ),
  ).toEqual([]);
});

test("accepts script arguments after the npm separator", () => {
  expect(
    validateNpmRunCommand(
      "npm run validate -- --strict",
      { scripts: { validate: "netdoc --validate" } },
      label,
    ),
  ).toEqual([]);
});

test.each(["vyops preflight", "bash -c 'npm run preflight'", "npm run"])(
  "rejects commands that do not call npm run directly: %s",
  (command) => {
    expect(
      validateNpmRunCommand(command, { scripts: { preflight: "vyops preflight" } }, label),
    ).toEqual([`${label} must call a declared package script with npm run <name>.`]);
  },
);

test("rejects an undeclared package script", () => {
  expect(validateNpmRunCommand("npm run validate", { scripts: {} }, label)).toEqual([
    `${label} must name a script declared in package.json.scripts.`,
  ]);
});

test("handles missing or invalid package scripts", () => {
  expect(validateNpmRunCommand("npm run validate", {}, label)).toEqual([
    `${label} must name a script declared in package.json.scripts.`,
  ]);
  expect(validateNpmRunCommand("npm run validate", { scripts: null }, label)).toEqual([
    `${label} must name a script declared in package.json.scripts.`,
  ]);
});

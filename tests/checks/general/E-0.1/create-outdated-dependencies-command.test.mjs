import { expect, test } from "@jest/globals";
import { createOutdatedDependenciesCommand } from "../../../../src/checks/general/E-0.1/create-outdated-dependencies-command.mjs";

test("builds the PATH-based non-Windows npm command", () => {
  expect(
    createOutdatedDependenciesCommand("fixture", {
      env: {},
      platform: "linux",
      execPath: "/usr/bin/node",
    }),
  ).toEqual({
    executable: "npm",
    args: ["outdated", "--json"],
    options: {
      cwd: "fixture",
      detached: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { npm_config_loglevel: "error" },
    },
  });
});

test("uses the invoking Windows npm executable and copies its environment", () => {
  const env = { npm_execpath: "C:\\node\\npm-cli.js", marker: "preserved" };
  expect(
    createOutdatedDependenciesCommand("fixture", {
      env,
      platform: "win32",
      execPath: "C:\\node\\node.exe",
    }),
  ).toEqual({
    executable: "C:\\node\\node.exe",
    args: ["C:\\node\\npm-cli.js", "outdated", "--json"],
    options: {
      cwd: "fixture",
      detached: false,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...env, npm_config_loglevel: "error" },
    },
  });
});

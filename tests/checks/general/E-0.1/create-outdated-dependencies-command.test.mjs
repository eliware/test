import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("resolves a relative npm executable and copies its environment", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-outdated-npm-path-"));
  const npmCli = join(root, "npm-cli.js");
  await writeFile(npmCli, "");
  const env = { npm_execpath: "npm-cli.js", marker: "preserved" };
  try {
    expect(
      createOutdatedDependenciesCommand(root, {
        env,
        platform: "linux",
        execPath: process.execPath,
      }),
    ).toEqual({
      executable: process.execPath,
      args: [npmCli, "outdated", "--json"],
      options: {
        cwd: root,
        detached: true,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...env, npm_config_loglevel: "error" },
      },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/cli/E-0.1.60/E-0.1.60.1.mjs";

test("rejects a CLI package without a binary entrypoint", async () => {
  await expect(run({ root: process.cwd(), packageJson: {} })).resolves.toEqual({
    ruleId: "E-0.1.60.1",
    status: "fail",
    message: "CLI repositories must declare a bin entrypoint.",
  });
});

test("validates the surface and runs both informational commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-rule-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "console.log('safe');");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  const calls = [];
  try {
    await expect(
      run({
        root,
        packageJson: { version: "8.0.0", bin: { cli: "bin/cli.mjs" } },
        executeEntrypoint: async (_command, args) => {
          calls.push(args[1]);
          return { code: 0, stdout: args[1] === "--version" ? "8.0.0\n" : "Usage\n" };
        },
      }),
    ).resolves.toEqual({ ruleId: "E-0.1.60.1", status: "pass", message: "" });
    expect(calls).toEqual(["--help", "--version"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("converts an informational-command error into a failed rule", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-error-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "console.log('safe');");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  try {
    await expect(
      run({
        root,
        packageJson: { version: "8.0.0", bin: "bin/cli.mjs" },
        executeEntrypoint: async () => ({ code: 0, stdout: "8.0.1" }),
      }),
    ).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("package version"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runs informational commands when README validation fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-missing-readme-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "console.log('safe');");
  const calls = [];
  try {
    await expect(
      run({
        root,
        packageJson: { version: "8.0.0", bin: "bin/cli.mjs" },
        executeEntrypoint: async (_command, args) => {
          calls.push(args[1]);
          return { code: 0, stdout: args[1] === "--version" ? "8.0.0\n" : "Usage\n" };
        },
      }),
    ).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("README.md must exist"),
    });
    expect(calls).toEqual(["--help", "--version"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

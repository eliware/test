import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/cli/E-1.60/E-1.60.1.mjs";

test("requires an entrypoint and documented informational commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-check-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "console.log('--help', '--version');");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  await expect(run({ root, packageJson: { bin: { cli: "bin/cli.mjs" } } })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when no CLI bin entrypoint is declared", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-no-bin-"));
  await expect(run({ root, packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "fail",
    message: "CLI repositories must declare a bin entrypoint.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when a declared entrypoint or README is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-missing-surface-"));
  await expect(run({ root, packageJson: { bin: { cli: "bin/cli.mjs" } } })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "fail",
    message: "Every declared CLI bin entrypoint and README.md must exist.",
  });
  await rm(root, { recursive: true, force: true });
});

test("executes help and version and requires the declared package version", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-execution-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  const calls = [];
  const executeEntrypoint = async (_command, args) => {
    calls.push(args[1]);
    return { code: 0, stdout: args[1] === "--version" ? "8.0.0\n" : "Usage: cli --help\n", stderr: "" };
  };
  await expect(run({
    root,
    packageJson: { version: "8.0.0", bin: { cli: "bin/cli.mjs" } },
    executeEntrypoint,
  })).resolves.toEqual({ ruleId: "E-1.60.1", status: "pass", message: "" });
  expect(calls).toEqual(["--help", "--version"]);
  await rm(root, { recursive: true, force: true });
});

test("supports a string bin declaration and stderr informational output", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-string-bin-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  await expect(run({
    root,
    packageJson: { version: "8.0.0", bin: "bin/cli.mjs" },
    executeEntrypoint: async (_command, args) => ({
      code: 0,
      stdout: "",
      stderr: args[1] === "--version" ? "8.0.0\n" : "Usage\n",
    }),
  })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("rejects nonzero informational commands and inconsistent versions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-execution-fail-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  await expect(run({
    root,
    packageJson: { version: "8.0.0", bin: { cli: "bin/cli.mjs" } },
    executeEntrypoint: async (_command, args) => ({ code: args[1] === "--help" ? 1 : 0, stdout: "8.0.1\n", stderr: "" }),
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("exit 0") });
  await expect(run({
    root,
    packageJson: { version: "8.0.0", bin: { cli: "bin/cli.mjs" } },
    executeEntrypoint: async () => ({ code: 0, stdout: "8.0.1\n", stderr: "" }),
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("must report package version") });
  await expect(run({
    root,
    packageJson: { version: "8.0.0", bin: { cli: "bin/cli.mjs" } },
    executeEntrypoint: async () => ({ code: 0 }),
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("must produce output") });
  await expect(run({
    root,
    packageJson: { version: "8.0.0", bin: { cli: "bin/cli.mjs" } },
    executeEntrypoint: async () => { throw new Error("spawn failed"); },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("could not execute") });
  await rm(root, { recursive: true, force: true });
});

test("fails when an informational command is undocumented", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-undocumented-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "console.log('--help');");
  await writeFile(join(root, "README.md"), "--help exit code");
  await expect(run({ root, packageJson: { bin: { cli: "bin/cli.mjs" } } })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "fail",
    message: "CLI README.md must document --version.",
  });
  await rm(root, { recursive: true, force: true });
});

test("requires controls for destructive CLI actions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-destructive-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "delete resource;");
  await writeFile(join(root, "README.md"), "--help --version exit code");
  await expect(run({ root, packageJson: { bin: { cli: "bin/cli.mjs" } } })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "fail",
    message: "Destructive CLI actions must provide dry-run or confirmation controls.",
  });
  await rm(root, { recursive: true, force: true });
});

test("accepts destructive CLI actions with confirmation controls", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-confirmed-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), "console.log('delete resource --confirm');");
  await writeFile(join(root, "README.md"), "--help --version exit code confirmation");
  await expect(run({ root, packageJson: { bin: { cli: "bin/cli.mjs" } } })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

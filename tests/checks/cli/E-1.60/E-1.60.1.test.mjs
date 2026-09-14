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
  await writeFile(join(root, "bin", "cli.mjs"), "delete resource --confirm;");
  await writeFile(join(root, "README.md"), "--help --version exit code confirmation");
  await expect(run({ root, packageJson: { bin: { cli: "bin/cli.mjs" } } })).resolves.toEqual({
    ruleId: "E-1.60.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

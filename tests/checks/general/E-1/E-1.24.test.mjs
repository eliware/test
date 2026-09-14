import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.24.mjs";

test("requires a workflow that handles push or pull request validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "validation.yml"),
    "on:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  validate:\n    runs-on: ubuntu-latest\n",
  );
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.24", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("rejects a workflow without validation events", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "validation.yml"),
    "on:\n  workflow_dispatch:\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("fails when workflows are missing or empty", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-ci-missing-"));
  await expect(run({ root: missing })).resolves.toEqual({
    ruleId: "E-1.24",
    status: "fail",
    message: ".github/workflows must contain a GitHub Actions validation workflow.",
  });
  await rm(missing, { recursive: true, force: true });

  const empty = await mkdtemp(join(tmpdir(), "eliware-test-ci-empty-"));
  await mkdir(join(empty, ".github", "workflows"), { recursive: true });
  await expect(run({ root: empty })).resolves.toEqual({
    ruleId: "E-1.24",
    status: "fail",
    message: ".github/workflows must contain a GitHub Actions validation workflow.",
  });
  await rm(empty, { recursive: true, force: true });
});


test("rejects workflows that do not satisfy every validation requirement", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-invalid-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  const workflow = (events, runner = "windows-latest") =>
    `on: ${events}\njobs:\n  validate:\n    runs-on: ${runner}\n`;
  await writeFile(join(root, ".github", "workflows", "validation.yml"), workflow("\n  push:\n    branches: [dev]\n"));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await writeFile(
    join(root, ".github", "workflows", "validation.yml"),
    "on:\n  pull_request:\njobs:\n  validate:\n    runs-on: windows-latest\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await writeFile(
    join(root, ".github", "workflows", "validation.yml"),
    "on:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  validate:\n    runs-on: [ubuntu-latest, windows-latest]\n",
  );
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.24", status: "pass", message: "" });
  for (const push of ["null", "{}", "\n    branches: [dev]\n"]) {
    await writeFile(
      join(root, ".github", "workflows", "validation.yml"),
      `on:\n  push: ${push}\n  pull_request:\njobs:\n  validate:\n    runs-on: ubuntu-latest\n`,
    );
    await expect(run({ root })).resolves.toMatchObject({ ruleId: "E-1.24", status: "fail" });
  }
  await rm(root, { recursive: true, force: true });
});

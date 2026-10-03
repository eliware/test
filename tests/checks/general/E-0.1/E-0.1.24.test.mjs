import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.24.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
} from "../../../../src/checks/general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";

const compliantSteps = `      - uses: actions/setup-node@v7
        with:
          node-version: 26
      - run: ${npm12InstallCommand}
      - run: >-
          ${npm12VersionCheckCommand}
      - run: npm ci
      - run: npm test`;

test("requires a workflow that handles push or pull request validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yaml"),
    `on:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n${compliantSteps}\n`,
  );
  await expect(
    run({ root, repositoryInventory: createRepositoryInventory(root) }),
  ).resolves.toEqual({
    ruleId: "E-0.1.24",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});
test("rejects a workflow without validation events", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yaml"), "on:\n  workflow_dispatch:\n");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("rejects a GitHub workflow containing multiple YAML documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-multidoc-"));
  const workflows = join(root, ".github", "workflows");
  await mkdir(workflows, { recursive: true });
  await writeFile(join(workflows, "ci.yaml"), "name: ci\n---\nname: second\n");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("does not combine CI events from one workflow with validation in another", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ci-split-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yaml"),
    `on:\n  push:\n    branches: [main]\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n${compliantSteps}\n`,
  );
  await writeFile(
    join(root, ".github", "workflows", "publish.yaml"),
    `on:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n${compliantSteps}\n`,
  );
  await expect(
    run({ root, repositoryInventory: createRepositoryInventory(root) }),
  ).resolves.toMatchObject({
    status: "fail",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when workflows are missing or empty", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-ci-missing-"));
  await expect(run({ root: missing })).resolves.toEqual({
    ruleId: "E-0.1.24",
    status: "fail",
    message: ".github/workflows must contain a GitHub Actions validation workflow.",
  });
  await rm(missing, { recursive: true, force: true });

  const empty = await mkdtemp(join(tmpdir(), "eliware-test-ci-empty-"));
  await mkdir(join(empty, ".github", "workflows"), { recursive: true });
  await expect(run({ root: empty })).resolves.toEqual({
    ruleId: "E-0.1.24",
    status: "fail",
    message: ".github/workflows must contain a GitHub Actions validation workflow.",
  });
  await rm(empty, { recursive: true, force: true });
});

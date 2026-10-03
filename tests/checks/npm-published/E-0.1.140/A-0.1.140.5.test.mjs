import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/npm-published/E-0.1.140/A-0.1.140.5.mjs";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
} from "../../../../src/checks/general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";

let root;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

async function writeWorkflow(
  publishStep = "npm publish --provenance",
  publishSetup = "actions/setup-node@v7",
) {
  if (root) await rm(root, { recursive: true, force: true });
  root = await mkdtemp(join(tmpdir(), "eliware-test-npm-oidc-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, "publish.yaml"),
    `permissions:\n  contents: read\njobs:\n  validate:\n    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 26\n      - run: ${npm12InstallCommand}\n      - run: >-\n          ${npm12VersionCheckCommand}\n      - run: npm ci\n      - run: npm test\n  publish:\n    permissions:\n      contents: read\n      id-token: write\n    steps:\n      - uses: ${publishSetup}\n        with:\n          node-version: 26\n          registry-url: https://registry.npmjs.org\n          package-manager-cache: false\n      - run: ${npm12InstallCommand}\n      - run: >-\n          ${npm12VersionCheckCommand}\n      - run: npm ci\n      - run: ${publishStep}\n`,
  );
}

test("accepts the documented Trusted Publisher job structure", async () => {
  await writeWorkflow();
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.140.5",
    status: "pass",
    message: "",
  });
});

test("aggregates independent permission, setup, and provenance findings", async () => {
  await writeWorkflow("npm publish", "actions/setup-node@v6");
  const file = join(root, ".github", "workflows", "publish.yaml");
  const workflow = await readFile(file, "utf8");
  await writeFile(
    file,
    workflow.replace(
      "permissions:\n  contents: read",
      "permissions:\n  id-token: write\n  contents: read",
    ),
  );
  const result = await run({ root });
  expect(result).toMatchObject({ status: "fail" });
  expect(result.message).toContain("id-token: write must be scoped");
  expect(result.message).toContain("setup-node@v7");
  expect(result.message).toContain("npm publish --provenance");
});

test("requires publish.yaml and an npm publication job", async () => {
  root = await mkdtemp(join(tmpdir(), "eliware-test-npm-oidc-missing-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "ci.yaml"), "jobs: {}\n");
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: "npm Trusted Publishing requires publish.yaml.",
  });

  await writeFile(join(directory, "publish.yaml"), "jobs:\n  publish:\n    steps: []\n");
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: "publish.yaml must contain an npm publication job.",
  });
});

test("reports workflow read errors", async () => {
  root = await mkdtemp(join(tmpdir(), "eliware-test-npm-oidc-unreadable-"));
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("could not be read"),
  });
});

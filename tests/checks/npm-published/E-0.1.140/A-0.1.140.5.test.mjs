import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/npm-published/E-0.1.140/A-0.1.140.5.mjs";

let root;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

async function writeWorkflow(publishStep = "npm publish --provenance", publishSetup = "actions/setup-node@v7") {
  if (root) await rm(root, { recursive: true, force: true });
  root = await mkdtemp(join(tmpdir(), "eliware-test-npm-oidc-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "publish.yml"), `permissions:\n  contents: read\njobs:\n  validate:\n    steps:\n      - run: npm ci\n      - run: npm test\n  publish:\n    permissions:\n      contents: read\n      id-token: write\n    steps:\n      - uses: ${publishSetup}\n        with:\n          node-version: 26\n          registry-url: https://registry.npmjs.org\n          package-manager-cache: false\n      - run: ${publishStep}\n`);
}

test("accepts the documented Trusted Publisher job structure", async () => {
  await writeWorkflow();
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.140.5",
    status: "pass",
    message: "",
  });
});

test("rejects workflows that do not follow the OIDC publish setup", async () => {
  await writeWorkflow("npm publish", "actions/setup-node@v6");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });

  await writeWorkflow("npm publish --provenance", "actions/setup-node@v7");
  const file = join(root, ".github", "workflows", "publish.yml");
  const workflow = await readFile(file, "utf8");
  await writeFile(file, workflow.replace("  contents: read\njobs:", "  contents: read\n  id-token: write\njobs:"));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("requires publish.yml and an npm publication job", async () => {
  root = await mkdtemp(join(tmpdir(), "eliware-test-npm-oidc-missing-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "ci.yml"), "jobs: {}\n");
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: "npm Trusted Publishing requires publish.yml.",
  });

  await writeFile(join(directory, "publish.yml"), "jobs:\n  publish:\n    steps: []\n");
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: "publish.yml must contain an npm publication job.",
  });
});

test("requires publish provenance and reports workflow read errors", async () => {
  await writeWorkflow("npm publish");
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: "The npm publication job must run npm publish --provenance.",
  });

  root = await mkdtemp(join(tmpdir(), "eliware-test-npm-oidc-unreadable-"));
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("could not be read"),
  });
});

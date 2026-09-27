import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { releaseTagFilter, releaseTagGuard } from "../../../../src/checks/ghcr-published/release-version-tag.mjs";
import { run } from "../../../../src/checks/npm-published/E-0.1.140/A-0.1.140.2.mjs";

function withValidationDependency(workflow) {
  return workflow
    .replace("jobs:\n", "jobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n")
    .replace("  publish:\n", "  publish:\n    needs: validate\n");
}

test("validates publication workflow gates when present", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    withValidationDependency(`on:
  push:
    tags: ["${releaseTagFilter}"]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: npm pkg get version
      - run: '${releaseTagGuard}'
      - run: npm publish
`),
  );
  expect((await run({ root, packageJson: { version: "1.2.3" } })).status).toBe("pass");
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "npm publish\n");
  expect((await run({ root, packageJson: { version: "1.2.3" } })).status).toBe("fail");
});

test("rejects an npm publication job without a successful Ubuntu validation dependency", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-missing-needs-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  const workflowPath = join(root, ".github", "workflows", "publish.yml");
  const validWorkflow = withValidationDependency(`on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`);
  await writeFile(workflowPath, validWorkflow.replace("    needs: validate\n", ""));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
  await writeFile(workflowPath, validWorkflow.replace("    needs: validate\n", "    needs: [validate]\n"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "pass" });
});

test("requires a tag release to match the package version", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-tag-version-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), withValidationDependency(`on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`));
  const context = { root, packageJson: { version: "1.2.3" }, env: { GITHUB_REF_TYPE: "tag", GITHUB_REF_NAME: "v1.2.3" } };
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await expect(run({ ...context, env: { ...context.env, GITHUB_REF_NAME: "v1.2.4" } })).resolves.toMatchObject({ status: "fail" });
});

test("rejects conditional or failure-tolerant npm publish steps", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-step-policy-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  const workflowPath = join(root, ".github", "workflows", "publish.yml");
  const workflow = (publishOptions) => withValidationDependency(`on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n${publishOptions}`);
  await writeFile(workflowPath, workflow("        if: always()\n"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
  await writeFile(workflowPath, workflow("        continue-on-error: true\n"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
  await writeFile(workflowPath, workflow("        continue-on-error: false\n"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "pass" });
});

test("fails when the required publication workflow is unavailable", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-publish-missing-"));
  await expect(run({ root: missing, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-nonpublication-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root, packageJson: {} })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects publication workflows without all release gates", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-invalid-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    "jobs:\n  publish:\n    steps:\n      - run: npm publish\n",
  );
  await expect(run({ root, packageJson: {} })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects publication workflows with inaccurate trigger or runner", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-policy-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  const file = join(root, ".github", "workflows", "publish.yml");
  const base = (tag, runner) => withValidationDependency(`on:\n  push:\n    tags: ["${tag}"]\njobs:\n  publish:\n    runs-on: ${runner}\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`);
  await writeFile(file, base("main", "ubuntu-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(file, base("v*.*.*", "ubuntu-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(file, base(releaseTagFilter, "ubuntu-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await writeFile(file, base(releaseTagFilter, "windows-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects an unparseable publication-looking workflow alongside a valid publisher", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-mixed-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm pkg get version\n      - run: echo v1.2.3 github.ref_name\n      - run: npm publish\n`);
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "npm publish\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "name: legacy\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("requires the release version check and publish step to share the Ubuntu publication job", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-split-jobs-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  const workflowPath = join(root, ".github", "workflows", "publish.yml");
  await writeFile(workflowPath, `on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm publish\n`);
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
  await writeFile(workflowPath, withValidationDependency(`on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "pass" });
});

test("accepts the normalized runner field when the workflow parser supplies runsOn", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-runson-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), withValidationDependency(`on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runsOn: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "pass" });
});

test("rejects a non-Ubuntu publication job even when unrelated workflow text names Ubuntu", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-runner-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `name: ubuntu-latest reference\non:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: windows-latest\n    steps:\n      - run: ''\n      - run: npm publish\n`);
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
});

test("rejects a publication job with no runner field", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-no-runner-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `name: ubuntu-latest reference\non:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    steps:\n      - run: ''\n      - run: npm publish\n`);
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
});

test("rejects a publication job whose normalized runner is not Ubuntu", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-normalized-runner-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runsOn: windows-latest\n    steps:\n      - run: ''\n      - run: npm publish\n`);
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
});

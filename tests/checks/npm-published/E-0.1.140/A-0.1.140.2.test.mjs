import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  releaseTagFilter,
  releaseTagGuard,
} from "../../../../src/checks/ghcr-published/release-version-tag.mjs";
import { run as checkPublicationWorkflow } from "../../../../src/checks/npm-published/E-0.1.140/A-0.1.140.2.mjs";

const run = (context) => checkPublicationWorkflow({ env: {}, ...context });

function withValidationDependency(workflow) {
  return workflow
    .replace(
      "jobs:\n",
      "jobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n",
    )
    .replace("  publish:\n", "  publish:\n    needs: validate\n");
}

async function createWorkflowRoot(name = "publish") {
  const root = await mkdtemp(join(tmpdir(), `eliware-test-${name}-`));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  return root;
}

test("accepts a valid publication workflow discovered from disk", async () => {
  const root = await createWorkflowRoot();
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    withValidationDependency(
      `on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`,
    ),
  );
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({
    status: "pass",
  });
});

test("rejects a publication-like workflow that cannot be parsed as jobs", async () => {
  const root = await createWorkflowRoot("malformed-publisher");
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    withValidationDependency(
      `on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`,
    ),
  );
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "npm publish\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({
    status: "fail",
  });
});

test("maps parsed publication workflows that violate release policy to failure", async () => {
  const root = await createWorkflowRoot("invalid-publisher");
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    "on:\n  push:\n    tags: [main]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm publish\n",
  );
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({
    status: "fail",
  });
});

test("uses process environment when invocation context omits it", async () => {
  const root = await createWorkflowRoot("process-env");
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    withValidationDependency(
      `on:\n  push:\n    tags: ["${releaseTagFilter}"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: '${releaseTagGuard}'\n      - run: npm publish\n`,
    ),
  );
  const previousType = process.env.GITHUB_REF_TYPE;
  const previousName = process.env.GITHUB_REF_NAME;
  process.env.GITHUB_REF_TYPE = "branch";
  process.env.GITHUB_REF_NAME = "main";
  try {
    await expect(
      checkPublicationWorkflow({ root, packageJson: { version: "1.2.3" } }),
    ).resolves.toMatchObject({ status: "pass" });
  } finally {
    if (previousType === undefined) delete process.env.GITHUB_REF_TYPE;
    else process.env.GITHUB_REF_TYPE = previousType;
    if (previousName === undefined) delete process.env.GITHUB_REF_NAME;
    else process.env.GITHUB_REF_NAME = previousName;
  }
});

test("requires a publication workflow and rejects unparseable publish content", async () => {
  const missing = await createWorkflowRoot("missing");
  await expect(run({ root: missing, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({
    status: "fail",
  });

  const root = await createWorkflowRoot("malformed");
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "npm publish\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({
    status: "fail",
  });
});

test("reports workflow-reading errors as failed check results", async () => {
  const root = await createWorkflowRoot("invalid-yaml");
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "jobs: [unterminated\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({
    status: "fail",
  });
});

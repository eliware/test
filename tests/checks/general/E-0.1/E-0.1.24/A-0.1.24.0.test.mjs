import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.24/A-0.1.24.0.mjs";

async function workflowRoot(contents) {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-rule-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), contents);
  return root;
}

test("passes when a temporary validation workflow complies with the aggregate policy", async () => {
  const root = await workflowRoot(
    "jobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n",
  );
  try {
    await expect(run({ root })).resolves.toEqual({
      ruleId: "A-0.1.24.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps a workflow without a compliant validation job to the rule result", async () => {
  const root = await workflowRoot(
    "jobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n",
  );
  try {
    await expect(run({ root })).resolves.toEqual({
      ruleId: "A-0.1.24.0",
      status: "fail",
      message: "ci.yml must run npm ci followed by npm test.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports every workflow missing the validation sequence", async () => {
  const root = await workflowRoot("jobs:\n  validate:\n    steps:\n      - run: npm test\n");
  await writeFile(
    join(root, ".github", "workflows", "deploy.yml"),
    "jobs:\n  deploy:\n    steps:\n      - run: deploy app\n",
  );
  const result = await run({ root });
  expect(result.message).toContain("ci.yml must run npm ci followed by npm test.");
  expect(result.message).toContain("deploy.yml must run npm ci followed by npm test.");
  await rm(root, { recursive: true, force: true });
});

test("leaves npm publication jobs to validators only when the profile applies", async () => {
  const root = await workflowRoot(
    "jobs:\n  publish:\n    steps:\n      - run: npm publish --provenance\n",
  );
  try {
    await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
    await expect(
      run({ root, packageJson: { eliware: { apply: ["npm-published"] } } }),
    ).resolves.toEqual({
      ruleId: "A-0.1.24.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recognizes GHCR publication through structured tag inputs", async () => {
  const root = await workflowRoot(
    "jobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n",
  );
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    "jobs:\n  publish:\n    steps:\n      - uses: eliware/container-publisher@v1\n        with:\n          tags: ghcr.io/eliware/app:latest\n",
  );
  try {
    await expect(
      run({ root, packageJson: { eliware: { apply: ["ghcr-published"] } } }),
    ).resolves.toMatchObject({ status: "pass", message: "" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normalizes invalid workflow YAML", async () => {
  const root = await workflowRoot("jobs: [\n");
  try {
    await expect(run({ root })).resolves.toMatchObject({
      ruleId: "A-0.1.24.0",
      status: "fail",
      message: expect.stringContaining("Workflow YAML could not be parsed"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

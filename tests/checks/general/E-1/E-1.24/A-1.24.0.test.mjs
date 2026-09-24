import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.24/A-1.24.0.mjs";

async function workflowRoot(contents) {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-rule-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), contents);
  return root;
}

test("passes when the validation workflow complies with the aggregate policy", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "A-1.24.0", status: "pass", message: "",
  });
});

test("maps a workflow without a compliant validation job to the rule result", async () => {
  const root = await workflowRoot("jobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n");
  try {
    await expect(run({ root })).resolves.toEqual({
      ruleId: "A-1.24.0",
      status: "fail",
      message: "ci.yml must run npm ci followed by npm test.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normalizes invalid workflow YAML", async () => {
  const root = await workflowRoot("jobs: [\n");
  try {
    await expect(run({ root })).resolves.toMatchObject({
      ruleId: "A-1.24.0",
      status: "fail",
      message: expect.stringContaining("Workflow YAML could not be parsed"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

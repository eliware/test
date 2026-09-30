import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/private/E-0.1.150/A-0.1.150.1.mjs";

async function fixture(ci, extraWorkflows = {}) {
  const root = await mkdtemp(join(tmpdir(), "eliware-private-ci-"));
  const workflows = join(root, ".github", "workflows");
  await mkdir(workflows, { recursive: true });
  await writeFile(join(workflows, "ci.yml"), ci);
  await Promise.all(
    Object.entries(extraWorkflows).map(([name, content]) =>
      writeFile(join(workflows, name), content),
    ),
  );
  return root;
}

test("rejects publication and deployment commands in ci.yml", async () => {
  for (const command of [
    "npm publish",
    "docker push image",
    "kubectl apply -f app.yml",
    "deploy service",
  ]) {
    const root = await fixture(`jobs:\n  test:\n    steps:\n      - run: ${command}\n`);
    await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
    await rm(root, { recursive: true, force: true });
  }
});

test("allows separately named GHCR publication and deployment workflows", async () => {
  const root = await fixture("jobs:\n  test:\n    steps:\n      - run: npm test\n", {
    "publish.yml": "jobs:\n  publish:\n    steps:\n      - run: docker push image\n",
    "deploy.yml": "jobs:\n  deploy:\n    steps:\n      - run: kubectl apply -f app.yml\n",
  });
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("requires an inspectable ci.yml", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-private-ci-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.150.1",
    status: "fail",
    message: "Private repositories must provide an inspectable .github/workflows/ci.yml.",
  });
  await rm(root, { recursive: true, force: true });
});

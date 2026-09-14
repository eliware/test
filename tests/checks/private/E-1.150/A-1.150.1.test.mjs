import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/private/E-1.150/A-1.150.1.mjs";

test("rejects publication and deployment from private CI", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-private-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "run: npm test");
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "run: npm publish");
  expect((await run({ root })).status).toBe("fail");
});

test("ignores non-workflow files and rejects every prohibited operation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-private-workflows-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "notes.txt"), "npm publish");
  await writeFile(join(root, ".github", "workflows", "deploy.yaml"), "kubectl apply");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, ".github", "workflows", "deploy.yaml"), "docker push image");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, ".github", "workflows", "deploy.yaml"), "deploy service");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("fails when workflows cannot be inspected", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-private-workflows-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.150.1",
    status: "fail",
    message: "Private repositories must provide inspectable CI workflows.",
  });
});

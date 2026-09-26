import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/workspace/E-0.1.110/A-0.1.110.2.mjs";

test("composes runbook discovery, validation, and documentation references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-runbooks-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=deploy");
  await writeFile(join(root, "runbooks", "README.md"), "index");
  await writeFile(
    join(root, "runbooks", "deploy.json"),
    JSON.stringify({
      id: "deploy",
      purpose: "Deploy",
      owner: "Ops",
      boundaries: { owns: ["Production"], excludes: ["Development"] },
      steps: ["verify"],
    }),
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.110.2",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("maps missing runbook indexes and malformed JSON to rule failures", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-workspace-runbooks-"));
  await expect(run({ root: missing })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await mkdir(join(missing, "runbooks"));
  await expect(run({ root: missing })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(missing, "runbooks", "README.md"), "index");
  await writeFile(join(missing, "runbooks", "broken.json"), "not json");
  await expect(run({ root: missing })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("valid JSON") }),
  );
  await rm(missing, { recursive: true, force: true });
});

test("maps record, reference, and index findings through the rule", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-runbook-findings-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=deploy");
  await writeFile(join(root, "runbooks", "README.md"), "index");
  const validRecord = {
    id: "deploy",
    purpose: "Deploy",
    owner: "Ops",
    boundaries: { owns: ["Production"], excludes: ["Development"] },
    steps: ["verify"],
  };
  const deployPath = join(root, "runbooks", "deploy.json");
  await writeFile(deployPath, JSON.stringify({ ...validRecord, boundaries: "Production" }));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("generic") });

  await writeFile(deployPath, JSON.stringify(validRecord));
  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=missing");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("missing") });

  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=deploy");
  await writeFile(join(root, "runbooks", "notify.json"), JSON.stringify({ ...validRecord, id: "notify" }));
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: "Runbook records must be indexed: notify.json.",
  });
  await rm(root, { recursive: true, force: true });
});

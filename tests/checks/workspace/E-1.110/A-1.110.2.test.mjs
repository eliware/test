import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/workspace/E-1.110/A-1.110.2.mjs";

test("validates runbook records", async () => {
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
    ruleId: "A-1.110.2",
    status: "pass",
    message: "",
  });
  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=missing");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("missing") }),
  );
  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=deploy");
  await writeFile(
    join(root, "runbooks", "deploy.json"),
    JSON.stringify({
      id: "deploy",
      purpose: "Deploy",
      owner: "Ops",
      boundaries: "Production",
      steps: ["verify"],
    }),
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("generic") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports missing indexes, invalid JSON, duplicate IDs, and unindexed records", async () => {
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

  const duplicate = await mkdtemp(join(tmpdir(), "eliware-workspace-runbooks-"));
  await mkdir(join(duplicate, "runbooks"));
  await writeFile(join(duplicate, "README.md"), "runbooks/a.json#id=one runbooks/b.json#id=one");
  await writeFile(join(duplicate, "runbooks", "README.md"), "index");
  const record = JSON.stringify({
    id: "one",
    purpose: "Run",
    owner: "Ops",
    boundaries: { owns: ["Production"], excludes: ["Development"] },
    steps: ["verify"],
  });
  await writeFile(join(duplicate, "runbooks", "a.json"), record);
  await writeFile(join(duplicate, "runbooks", "b.json"), record);
  await expect(run({ root: duplicate })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "Runbook IDs must be unique: one." }),
  );
  await rm(duplicate, { recursive: true, force: true });

  const unindexed = await mkdtemp(join(tmpdir(), "eliware-workspace-runbooks-"));
  await mkdir(join(unindexed, "runbooks"));
  await writeFile(join(unindexed, "README.md"), "runbooks/a.json#id=one");
  await writeFile(join(unindexed, "runbooks", "README.md"), "index");
  await writeFile(join(unindexed, "runbooks", "a.json"), record);
  await writeFile(
    join(unindexed, "runbooks", "b.json"),
    JSON.stringify({
      id: "two",
      purpose: "Run",
      owner: "Ops",
      boundaries: { owns: ["Production"], excludes: ["Development"] },
      steps: ["verify"],
    }),
  );
  await expect(run({ root: unindexed })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "Runbook records must be indexed: b.json." }),
  );
});

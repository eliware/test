import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/workspace/E-0.1.110/A-0.1.110.3.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("requires workspace README indexes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-index-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "runbooks", "README.md"), "index");
  await writeFile(join(root, "README.md"), "runbooks/README.md");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.110.3",
    status: "pass",
    message: "",
  });
  await writeFile(join(root, "runbooks", "deploy.json"), "{}");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("deploy.json") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("uses the shared inventory for runbook directory discovery and README reads", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-index-inventory-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "README.md"), "runbooks/README.md");
  await writeFile(join(root, "runbooks", "README.md"), "deploy.json#id=deploy");
  await writeFile(join(root, "runbooks", "deploy.json"), "{}");
  const repositoryInventory = createRepositoryInventory(root);

  await expect(run({ root, repositoryInventory })).resolves.toEqual({
    ruleId: "A-0.1.110.3",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports missing workspace links and optional structured-record links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-index-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "runbooks", "README.md"), "index");
  await writeFile(join(root, "README.md"), "overview");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.110.3",
    status: "fail",
    message: "Workspace README.md must link runbooks/README.md.",
  });

  await writeFile(join(root, "README.md"), "runbooks/README.md");
  await writeFile(join(root, "runbooks", "deploy.json"), "{}");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("deploy.json") }),
  );
  await writeFile(join(root, "runbooks", "README.md"), "deploy.json#id=deploy");
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "Workspace README.md must link specs/directives.json." }),
  );
  await writeFile(join(root, "README.md"), "runbooks/README.md specs/directives.json");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.110.3",
    status: "pass",
    message: "",
  });
  await expect(run({ root: `${root}-missing` })).resolves.toEqual({
    ruleId: "A-0.1.110.3",
    status: "fail",
    message: "Workspace README.md and runbooks/README.md are required.",
  });
});

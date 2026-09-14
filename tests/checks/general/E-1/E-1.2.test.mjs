import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.2.mjs";

async function fixture({ rootReadme = true, specsReadme = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-2-"));
  if (rootReadme) await writeFile(join(root, "README.md"), "# Project\n");
  if (specsReadme) {
    await mkdir(join(root, "specs"));
    await writeFile(join(root, "specs", "README.md"), "# Specs\n");
  }
  return root;
}

async function cleanup(root) {
  await rm(root, { recursive: true, force: true });
}

test("passes when both required documentation indexes exist", async () => {
  const root = await fixture();
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.2", status: "pass", message: "" });
  await cleanup(root);
});

test("fails when the root README is missing", async () => {
  const root = await fixture({ rootReadme: false });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.2",
    status: "fail",
    message: "Required documentation files are missing: README.md.",
  });
  await cleanup(root);
});

test("fails when the specs index is missing", async () => {
  const root = await fixture({ specsReadme: false });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.2",
    status: "fail",
    message: "Required documentation files are missing: specs/README.md.",
  });
  await cleanup(root);
});

test("reports all missing documentation files together", async () => {
  const root = await fixture({ rootReadme: false, specsReadme: false });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.2",
    status: "fail",
    message: "Required documentation files are missing: README.md, specs/README.md.",
  });
  await cleanup(root);
});

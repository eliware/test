import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.8.mjs";

async function createOwnerFile() {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-rule-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  return root;
}

const packageJson = { name: "@eliware/fixture" };
const ownerOptions = { trackedFiles: [], checkIgnored: async () => true };

test("requires package identity before composing mailbox validation", async () => {
  await expect(run({ root: tmpdir(), packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.8",
    status: "fail",
    message: "package.json.name is required to derive the mailbox owner.",
  });
});

test("composes local-owner and template validation", async () => {
  const root = await createOwnerFile();
  try {
    await expect(run({ root, packageJson, ...ownerOptions, findFiles: async () => [] })).resolves.toEqual({
      ruleId: "E-1.8",
      status: "pass",
      message: "",
    });
    await expect(run({
      root,
      packageJson,
      ...ownerOptions,
      findFiles: async () => { throw new Error("scan failed"); },
    })).resolves.toMatchObject({
      status: "fail",
      message: "Environment files could not be inspected: scan failed",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps local-owner and template validation failures to the check result", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-rule-missing-"));
  try {
    await expect(run({ root, packageJson })).resolves.toMatchObject({
      ruleId: "E-1.8",
      status: "fail",
      message: expect.stringContaining("Local .env must define"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }

  const invalidTemplate = await createOwnerFile();
  try {
    await expect(run({
      root: invalidTemplate,
      packageJson,
      trackedFiles: [".env.example"],
      checkIgnored: async () => true,
      findFiles: async () => [".env.example"],
    })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("Environment template") });
  } finally {
    await rm(invalidTemplate, { recursive: true, force: true });
  }
});

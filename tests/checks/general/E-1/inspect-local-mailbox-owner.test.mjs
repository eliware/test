import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { inspectLocalMailboxOwner } from "../../../../src/checks/general/E-1/inspect-local-mailbox-owner.mjs";

async function createOwnerFile(content) {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-owner-"));
  await writeFile(join(root, ".env"), content);
  return root;
}

const expected = "fixture@eliware.org";

test("validates the owner declaration and returns tracked files", async () => {
  const root = await createOwnerFile('export MAIL_OWNER_ADDRESS="fixture@eliware.org"\n');
  try {
    await expect(inspectLocalMailboxOwner(root, expected, {
      trackedFiles: [],
      checkIgnored: async (_root, path) => path === ".env",
    })).resolves.toEqual({ trackedFiles: [], error: null });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each([
  "MAILBOX_OWNER=fixture@eliware.org",
  "MAIL_OWNER_ADDRESS=other@eliware.org",
])("rejects a non-canonical local owner: %s", async (content) => {
  const root = await createOwnerFile(content);
  try {
    await expect(inspectLocalMailboxOwner(root, expected, {
      trackedFiles: [], checkIgnored: async () => true,
    })).resolves.toEqual({ error: `Local .env must define the mailbox owner as ${expected}.` });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed for missing files, unavailable Git evidence, tracked files, and non-ignored .env", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-mailbox-owner-"));
  await expect(inspectLocalMailboxOwner(missing, expected, { trackedFiles: [] })).resolves.toEqual({
    error: `Local .env must define the mailbox owner as ${expected}.`,
  });
  await rm(missing, { recursive: true, force: true });

  const root = await createOwnerFile("MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  try {
    await expect(inspectLocalMailboxOwner(root, expected, {
      readTracked: async () => null,
      checkIgnored: async () => true,
    })).resolves.toEqual({
      error: "Git tracking inspection was unavailable; cannot validate the local mailbox owner safely.",
    });
    await expect(inspectLocalMailboxOwner(root, expected, {
      trackedFiles: [".env"], checkIgnored: async () => true,
    })).resolves.toEqual({ error: "The local mailbox owner file .env must remain untracked." });
    await expect(inspectLocalMailboxOwner(root, expected, {
      trackedFiles: [], checkIgnored: async () => false,
    })).resolves.toEqual({ error: "The local mailbox owner file .env must be ignored by Git." });
    await expect(inspectLocalMailboxOwner(root, expected, {
      readTracked: async () => [],
    })).resolves.toEqual({ error: "The local mailbox owner file .env must be ignored by Git." });
    await expect(inspectLocalMailboxOwner(root, expected)).resolves.toMatchObject({
      error: expect.stringContaining("Git tracking inspection was unavailable"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { inspectLocalMailboxOwner } from "../../../../src/checks/general/E-0.1/inspect-local-mailbox-owner.mjs";

async function createOwnerFile(content) {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-owner-"));
  await writeFile(join(root, ".env"), content);
  return root;
}

const expected = "fixture@eliware.org";

test("validates the owner declaration using only current files and local ignore rules", async () => {
  const root = await createOwnerFile('export MAIL_OWNER_ADDRESS="fixture@eliware.org"\n');
  try {
    await writeFile(join(root, ".gitignore"), ".env\n");
    await expect(inspectLocalMailboxOwner(root, expected)).resolves.toEqual({ error: null });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires the local .env file to exist", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-owner-missing-"));
  try {
    await expect(inspectLocalMailboxOwner(root, expected)).resolves.toEqual({
      error: `Local .env must define the mailbox owner as ${expected}.`,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each(["MAILBOX_OWNER=fixture@eliware.org", "MAIL_OWNER_ADDRESS=other@eliware.org"])(
  "rejects a non-canonical local owner: %s",
  async (content) => {
    const root = await createOwnerFile(content);
    try {
      await expect(
        inspectLocalMailboxOwner(root, expected, { checkIgnored: async () => true }),
      ).resolves.toEqual({
        error: `Local .env must define the mailbox owner as ${expected}.`,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test("requires .env to be ignored by a rule in the current .gitignore", async () => {
  const root = await createOwnerFile("MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  try {
    await expect(inspectLocalMailboxOwner(root, expected)).resolves.toEqual({
      error: "The local mailbox owner file .env must be ignored by the repository's .gitignore.",
    });
    await writeFile(join(root, ".gitignore"), ".env\n");
    await expect(inspectLocalMailboxOwner(root, expected)).resolves.toEqual({ error: null });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not ask for tracked-file evidence", async () => {
  const root = await createOwnerFile("MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  try {
    await writeFile(join(root, ".gitignore"), ".env\n");
    await expect(
      inspectLocalMailboxOwner(root, expected, {
        readTracked: async () => {
          throw new Error("must not inspect Git");
        },
      }),
    ).resolves.toEqual({ error: null });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

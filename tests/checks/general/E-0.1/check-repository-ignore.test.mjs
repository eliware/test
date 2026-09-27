import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { isIgnoredByRepositoryRules } from "../../../../src/checks/general/E-0.1/check-repository-ignore.mjs";

test("evaluates current repository .gitignore rules without Git state", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-ignore-"));
  try {
    await writeFile(join(root, ".gitignore"), "*.local\n!keep.local\ncache/\n");
    await expect(isIgnoredByRepositoryRules(root, "secrets.local")).resolves.toBe(true);
    await expect(isIgnoredByRepositoryRules(root, "keep.local")).resolves.toBe(false);
    await expect(isIgnoredByRepositoryRules(root, "cache/file.txt")).resolves.toBe(true);
    await expect(isIgnoredByRepositoryRules(root, "visible.txt")).resolves.toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("treats missing repository ignore rules as no ignored paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-ignore-missing-"));
  try {
    await expect(isIgnoredByRepositoryRules(root, "local.env")).resolves.toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

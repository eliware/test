import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityReciprocity } from "../../../../src/checks/documentation/E-1.100/validate-authority-reciprocity.mjs";

test("validates repository identity and reciprocal map links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ repositoryId: "eliware/example" }));
  await expect(validateAuthorityReciprocity({
    root, file, entries: [{ repository: "eliware/example", authorityFile: "./specs/authority.json" }],
  })).resolves.toBeNull();
});

test("rejects mismatched repository identities", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ repositoryId: "other/repository" }));
  await expect(validateAuthorityReciprocity({
    root, file, entries: [{ repository: "eliware/example", authorityFile: "./specs/authority.json" }],
  })).resolves.toContain("does not match");
});

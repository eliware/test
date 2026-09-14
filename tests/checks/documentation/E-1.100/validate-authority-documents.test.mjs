import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityDocuments } from "../../../../src/checks/documentation/E-1.100/validate-authority-documents.mjs";

test("ignores unrelated JSON documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-docs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "other.json"), "{}\n");
  await expect(validateAuthorityDocuments(root, ["specs/other.json"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAuthorityTarget } from "../../../../src/checks/documentation/E-1.100/read-authority-target.mjs";

test("reads directories and reports malformed local authority documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-document-"));
  const file = join(root, "authority.json");
  await mkdir(join(root, "directory"));
  await writeFile(join(root, "broken.json"), "not json");
  await expect(readAuthorityTarget({ root, file, reference: "./directory", label: "target" })).resolves.toEqual(expect.objectContaining({ document: null }));
  await expect(readAuthorityTarget({ root, file, reference: "./broken.json", label: "target" })).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("target does not resolve") }));
  await expect(readAuthorityTarget({ root, file, reference: "../external.json", label: "target" })).resolves.toEqual(expect.objectContaining({ unavailable: true }));
  await expect(readAuthorityTarget({ root, file, reference: "https://example.test", label: "target" })).resolves.toEqual({ error: "target must be a repository-relative path." });
});

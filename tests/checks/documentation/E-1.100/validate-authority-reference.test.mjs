import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityReference } from "../../../../src/checks/documentation/E-1.100/validate-authority-reference.mjs";

test("resolves local authority targets and defers unavailable external targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reference-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "specs", "authority.json");
  await writeFile(join(root, "specs", "target.json"), "{}");
  await expect(validateAuthorityReference({ root, file, reference: "./target.json", label: "target" })).resolves.toBeNull();
  await expect(validateAuthorityReference({ root, file, reference: "../../external/authority.json", label: "target" })).resolves.toBeNull();
});

test("rejects malformed and missing local authority targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reference-invalid-"));
  const file = join(root, "authority.json");
  await expect(validateAuthorityReference({ root, file, reference: "https://example.test/a", label: "target" })).resolves.toContain("repository-relative");
  await expect(validateAuthorityReference({ root, file, reference: "./missing.json", label: "target" })).resolves.toContain("does not resolve");
});

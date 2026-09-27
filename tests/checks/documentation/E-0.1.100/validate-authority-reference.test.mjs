import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityReference } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-reference.mjs";

test("resolves local authority targets and defers unavailable external targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reference-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "specs", "authority.json");
  await writeFile(join(root, "specs", "target.json"), "{}");
  await expect(
    validateAuthorityReference({ root, file, reference: "./target.json", label: "target" }),
  ).resolves.toBeNull();
  await expect(
    validateAuthorityReference({
      root,
      file,
      reference: "../../registered/authority.json",
      label: "target",
      registeredRepositoryRoots: [join(root, "..", "registered")],
    }),
  ).resolves.toBeNull();
});

test("rejects unavailable external authority targets outside registered repositories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reference-unregistered-"));
  await expect(
    validateAuthorityReference({
      root,
      file: join(root, "authority.json"),
      reference: "../unregistered/authority.json",
      label: "target",
    }),
  ).resolves.toContain("outside every registered repository path");
});

test("rejects malformed and missing local authority targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reference-invalid-"));
  const file = join(root, "authority.json");
  await expect(
    validateAuthorityReference({
      root,
      file,
      reference: "https://example.test/a",
      label: "target",
    }),
  ).resolves.toContain("repository-relative");
  await expect(
    validateAuthorityReference({ root, file, reference: "./missing.json", label: "target" }),
  ).resolves.toContain("does not resolve");
});

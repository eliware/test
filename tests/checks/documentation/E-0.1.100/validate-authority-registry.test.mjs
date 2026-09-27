import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityRegistry } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry.mjs";

const entry = (overrides = {}) => ({
  repository: "eliware/example",
  path: "repositories/example",
  package: "package.json",
  authorityFile: "specs/authority.json",
  reference: "README.md",
  governs: ["example.subject"],
  directiveNamespaces: ["E-0.1"],
  ...overrides,
});

test("coordinates reference and policy validation for each repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-registry-"));
  const repositoryRoot = join(root, "repositories", "example");
  await mkdir(join(repositoryRoot, "specs"), { recursive: true });
  await writeFile(join(repositoryRoot, "package.json"), "{}");
  await writeFile(join(repositoryRoot, "specs", "authority.json"), "{}");
  await writeFile(join(repositoryRoot, "README.md"), "example");
  const context = { root, file: join(root, "authority-map.json") };
  try {
    await expect(validateAuthorityRegistry({ ...context, entries: [entry()] })).resolves.toBeNull();
    await expect(
      validateAuthorityRegistry({ ...context, entries: [entry({ package: "missing.json" })] }),
    ).resolves.toContain("does not resolve");
    await expect(
      validateAuthorityRegistry({ ...context, entries: [entry({ directiveNamespaces: ["bad"] })] }),
    ).resolves.toContain("valid directiveNamespaces");
    await expect(
      validateAuthorityRegistry({ ...context, entries: [entry({ governs: [] })] }),
    ).resolves.toContain("valid governs");
    await expect(
      validateAuthorityRegistry({ ...context, entries: [entry({ baselineFor: ["missing"] })] }),
    ).resolves.toContain("unsupported delegation");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps malformed registries and duplicate repository errors", async () => {
  const context = { root: process.cwd(), file: join(process.cwd(), "authority-map.json") };
  await expect(validateAuthorityRegistry({ ...context, entries: null })).resolves.toContain(
    "repositoryRegistry",
  );
  await expect(validateAuthorityRegistry({ ...context, entries: [null] })).resolves.toContain(
    "declare a repository",
  );
  await expect(
    validateAuthorityRegistry({ ...context, entries: [entry(), entry()] }),
  ).resolves.toContain("Duplicate authority repository");
});

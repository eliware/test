import { expect, test } from "@jest/globals";
import { validateAuthorityRegistry } from "../../../../src/checks/documentation/E-1.100/validate-authority-registry.mjs";

const entry = (overrides = {}) => ({
  repository: "eliware/example",
  path: ".",
  package: "./package.json",
  authorityFile: "./specs/authority.json",
  reference: "./README.md",
  governs: ["example.subject"],
  directiveNamespaces: ["E-1"],
  ...overrides,
});

test("rejects absent registry and malformed entries", async () => {
  await expect(validateAuthorityRegistry({ root: "C:\\repo", file: "C:\\repo\\authority-map.json", entries: null })).resolves.toContain("repositoryRegistry");
  await expect(validateAuthorityRegistry({ root: "C:\\repo", file: "C:\\repo\\authority-map.json", entries: [null] })).resolves.toContain("declare a repository");
});

test("validates distinct repository references and namespaces", async () => {
  const context = { root: process.cwd(), file: `${process.cwd()}\\authority-map.json` };
  await expect(validateAuthorityRegistry({ ...context, entries: [entry(), entry()] })).resolves.toContain("Duplicate");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ directiveNamespaces: ["bad"], path: ".", package: ".", authorityFile: ".", reference: "." })] })).resolves.toContain("valid directiveNamespaces");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ path: null })] })).resolves.toContain("declare path");
});

test("rejects incomplete references, delegation, and normative targets", async () => {
  const context = { root: process.cwd(), file: `${process.cwd()}\\authority-map.json` };
  for (const field of ["package", "authorityFile", "reference"]) {
    await expect(validateAuthorityRegistry({ ...context, entries: [entry({ [field]: null })] })).resolves.toContain(`declare ${field}`);
  }
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ package: "../outside.json" })] })).resolves.toContain("within its repository");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ repository: undefined })] })).resolves.toContain("declare a repository");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ governs: [] })] })).resolves.toContain("valid governs");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ governs: [""] })] })).resolves.toContain("valid governs");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ baselineFor: ["missing"] })] })).resolves.toContain("unsupported delegation");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ inheritsSharedBaselineFrom: "missing" })] })).resolves.toContain("unsupported delegation");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ path: "sub", package: "." })] })).resolves.toContain("does not resolve");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry(), entry({ repository: "eliware/other" })] })).resolves.toContain("Duplicate normative");
  await expect(validateAuthorityRegistry({ ...context, entries: [entry({ baselineFor: ["eliware/other"], inheritsSharedBaselineFrom: "eliware/other" }), entry({ repository: "eliware/other", governs: ["other.subject"] })] })).resolves.toBeNull();
});

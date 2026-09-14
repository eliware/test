import { expect, test } from "@jest/globals";
import { validateAuthorityRegistry } from "../../../../src/checks/documentation/E-1.100/validate-authority-registry.mjs";

const entry = (overrides = {}) => ({
  repository: "eliware/example",
  path: ".",
  package: "./package.json",
  authorityFile: "./specs/authority.json",
  reference: "./README.md",
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

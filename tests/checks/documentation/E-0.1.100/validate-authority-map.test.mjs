import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityMap } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-map.mjs";

function entry(overrides = {}) {
  return {
    repository: "eliware/example",
    path: ".",
    package: "./package.json",
    authorityFile: "./specs/authority.json",
    reference: "./README.md",
    governs: ["example.subject"],
    directiveNamespaces: ["E-0.1"],
    ...overrides,
  };
}

async function createFixture(authority = { repositoryId: "eliware/example" }) {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-map-composition-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "package.json"), "{}");
  await writeFile(join(root, "README.md"), "# Example");
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify(authority));
  return { root, file: join(root, "authority-map.json") };
}

test("composes registry, reciprocal authority, and path validation", async () => {
  const context = await createFixture();
  await expect(validateAuthorityMap({
    ...context,
    document: {
      repositoryRegistry: [entry()],
      crosslinks: [{ path: "./README.md" }],
      structuredDocuments: [{ path: "./specs/authority.json" }],
    },
  })).resolves.toBeNull();
});

test("rejects a missing document and propagates registry validation errors", async () => {
  const context = await createFixture();
  await expect(validateAuthorityMap({ ...context, document: null })).resolves.toBe(
    "authority-map.json must declare repositoryRegistry.",
  );
  await expect(validateAuthorityMap({
    ...context,
    document: { repositoryRegistry: [entry({ directiveNamespaces: ["invalid"] })] },
  })).resolves.toContain("valid directiveNamespaces");
});

test("propagates reciprocal authority and path validation errors", async () => {
  const mismatch = await createFixture({ repositoryId: "other/repository" });
  await expect(validateAuthorityMap({
    ...mismatch,
    document: { repositoryRegistry: [entry()] },
  })).resolves.toContain("repositoryId does not match");

  const valid = await createFixture();
  await expect(validateAuthorityMap({
    ...valid,
    document: { repositoryRegistry: [entry()], crosslinks: [{ path: "./missing.json" }] },
  })).resolves.toContain("crosslinks[0] does not resolve");
});

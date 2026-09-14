import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityMap } from "../../../../src/checks/documentation/E-1.100/validate-authority-map.mjs";

function entry(overrides = {}) {
  return {
    repository: "eliware/example",
    path: ".",
    package: "./package.json",
    authorityFile: "./specs/authority.json",
    reference: "./README.md",
    directiveNamespaces: ["E-1"],
    ...overrides,
  };
}

test("validates registry identity, namespaces, and structured authority links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-map-"));
  const file = join(root, "authority-map.json");
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "package.json"), "{}");
  await writeFile(join(root, "README.md"), "# Example");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ repositoryId: "eliware/example" }),
  );
  await expect(
    validateAuthorityMap({
      root,
      file,
      document: {
        repositoryRegistry: [entry()],
        crosslinks: [{ path: "./README.md" }],
        structuredDocuments: [{ path: "./specs/authority.json" }],
      },
    }),
  ).resolves.toBeNull();
});

test("rejects duplicate repositories and invalid registry records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-map-invalid-"));
  const file = join(root, "authority-map.json");
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "package.json"), "{}");
  await writeFile(join(root, "README.md"), "# Example");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ repositoryId: "eliware/example" }),
  );
  await expect(
    validateAuthorityMap({ root, file, document: { repositoryRegistry: [entry(), entry()] } }),
  ).resolves.toContain("Duplicate authority repository");
  await expect(
    validateAuthorityMap({
      root,
      file,
      document: { repositoryRegistry: [entry({ directiveNamespaces: ["invalid"] })] },
    }),
  ).resolves.toContain("valid directiveNamespaces");
});

async function fixture(authority = { repositoryId: "eliware/example" }) {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-map-branches-"));
  const file = join(root, "authority-map.json");
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "package.json"), "{}");
  await writeFile(join(root, "README.md"), "# Example");
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify(authority));
  return { root, file };
}

test("rejects malformed authority-map documents and records", async () => {
  const context = await fixture();
  await expect(validateAuthorityMap({ ...context, document: null })).resolves.toBe(
    "authority-map.json must declare repositoryRegistry.",
  );
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [null] } }),
  ).resolves.toBe("repositoryRegistry[0] must declare a repository.");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry({ path: null })] } }),
  ).resolves.toBe("eliware/example must declare path.");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry({ package: null })] } }),
  ).resolves.toBe("eliware/example must declare package.");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry({ authorityFile: null })] } }),
  ).resolves.toBe("eliware/example must declare authorityFile.");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry({ reference: null })] } }),
  ).resolves.toBe("eliware/example must declare reference.");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry({ directiveNamespaces: null })] } }),
  ).resolves.toContain("valid directiveNamespaces");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry({ directiveNamespaces: ["E"] })] } }),
  ).resolves.toContain("valid directiveNamespaces");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry()], crosslinks: [null] } }),
  ).resolves.toBe("authority-map crosslinks[0] must contain a path.");
  await expect(
    validateAuthorityMap({ ...context, document: { repositoryRegistry: [entry()], structuredDocuments: [null] } }),
  ).resolves.toBe("authority-map structuredDocuments[0] must contain a path.");
});

test("validates authority identity and reciprocal global map links", async () => {
  const mismatch = await fixture({ repositoryId: "other/repository" });
  await expect(
    validateAuthorityMap({ ...mismatch, document: { repositoryRegistry: [entry()] } }),
  ).resolves.toContain("repositoryId does not match");

  const reciprocal = await fixture({
    repositoryId: "eliware/example",
    globalAuthorityMap: "../package.json",
  });
  await writeFile(join(reciprocal.root, "authority-map.json"), "{}");
  await expect(
    validateAuthorityMap({
      ...reciprocal,
      document: { repositoryRegistry: [entry()] },
    }),
  ).resolves.toContain("does not point back");

  const good = await fixture({
    repositoryId: "eliware/example",
    globalAuthorityMap: "../authority-map.json",
  });
  await writeFile(join(good.root, "authority-map.json"), "{}");
  await expect(
    validateAuthorityMap({ ...good, document: { repositoryRegistry: [entry()] } }),
  ).resolves.toBeNull();
});

test("propagates invalid authority links and allows unavailable external records", async () => {
  const context = await fixture();
  await expect(
    validateAuthorityMap({
      ...context,
      document: { repositoryRegistry: [entry({ path: "./missing" })] },
    }),
  ).resolves.toContain("does not resolve");
  await expect(
    validateAuthorityMap({
      ...context,
      document: { repositoryRegistry: [entry({ authorityFile: "../external.json" })] },
    }),
  ).resolves.toBeNull();
  await expect(
    validateAuthorityMap({
      ...context,
      document: {
        repositoryRegistry: [entry()],
        crosslinks: [{ path: "./missing.json" }],
      },
    }),
  ).resolves.toContain("crosslinks[0] does not resolve");
  await expect(
    validateAuthorityMap({
      ...context,
      document: {
        repositoryRegistry: [entry()],
        structuredDocuments: [{ path: "./missing.json" }],
      },
    }),
  ).resolves.toContain("structuredDocuments[0] does not resolve");
});

test("reports malformed authority documents and broken reciprocal links", async () => {
  const malformed = await fixture();
  await writeFile(join(malformed.root, "specs", "authority.json"), "not json");
  await expect(
    validateAuthorityMap({ ...malformed, document: { repositoryRegistry: [entry()] } }),
  ).resolves.toContain("authorityFile does not resolve");

  const brokenReciprocal = await fixture({
    repositoryId: "eliware/example",
    globalAuthorityMap: "./missing-map.json",
  });
  await expect(
    validateAuthorityMap({ ...brokenReciprocal, document: { repositoryRegistry: [entry()] } }),
  ).resolves.toContain("globalAuthorityMap does not resolve");
});

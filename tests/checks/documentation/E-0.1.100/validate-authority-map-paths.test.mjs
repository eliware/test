import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { join } from "node:path";
import { validateAuthorityMapPaths } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-map-paths.mjs";

const context = {
  root: resolve("fixture-repo"),
  file: resolve("fixture-repo", "authority-map.json"),
};

test("accepts empty optional path collections", async () => {
  await expect(validateAuthorityMapPaths(context)).resolves.toBeNull();
});

test("reports malformed path collections and ignores unusable registry entries", async () => {
  const result = await validateAuthorityMapPaths({
    ...context,
    repositoryRegistry: "invalid",
    crosslinks: "invalid",
    structuredDocuments: "invalid",
  });
  expect(result).toContain("repositoryRegistry must be an array");
  expect(result).toContain("crosslinks must be an array");
  expect(result).toContain("structuredDocuments must be an array");
  await expect(
    validateAuthorityMapPaths({
      ...context,
      repositoryRegistry: [null, {}, { path: 42 }, { path: "../registered" }],
    }),
  ).resolves.toBeNull();
});

test("accepts existing crosslinks and structured documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-paths-"));
  try {
    await mkdir(join(root, "specs"));
    await writeFile(join(root, "README.md"), "# Example");
    await writeFile(join(root, "specs", "authority.json"), "{}");
    await expect(
      validateAuthorityMapPaths({
        root,
        file: join(root, "authority-map.json"),
        crosslinks: [{ path: "./README.md" }],
        structuredDocuments: [{ path: "./specs/authority.json" }],
      }),
    ).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts unavailable external paths only when their repository is registered", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-registered-path-"));
  try {
    await expect(
      validateAuthorityMapPaths({
        root,
        file: join(root, "authority-map.json"),
        repositoryRegistry: [{ path: "../registered-repository" }],
        crosslinks: [{ path: "../registered-repository/specs/authority.json" }],
      }),
    ).resolves.toBeNull();
    await expect(
      validateAuthorityMapPaths({
        root,
        file: join(root, "authority-map.json"),
        repositoryRegistry: [{ path: "../registered-repository" }],
        structuredDocuments: [{ path: "../unregistered-repository/specs/authority.json" }],
      }),
    ).resolves.toContain("outside every registered repository path");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects malformed and unresolved path records", async () => {
  await expect(validateAuthorityMapPaths({ ...context, crosslinks: [null] })).resolves.toContain(
    "crosslinks[0]",
  );
  await expect(
    validateAuthorityMapPaths({ ...context, structuredDocuments: [null] }),
  ).resolves.toContain("structuredDocuments[0]");
  await expect(
    validateAuthorityMapPaths({ ...context, crosslinks: [{ path: "./missing" }] }),
  ).resolves.toContain("does not resolve");
  await expect(
    validateAuthorityMapPaths({ ...context, structuredDocuments: [{ path: "./missing.json" }] }),
  ).resolves.toContain("does not resolve");
});

test("reports invalid crosslinks and structured documents together", async () => {
  const result = await validateAuthorityMapPaths({
    ...context,
    crosslinks: [null, { path: "./missing-link.md" }],
    structuredDocuments: [null, { path: "./missing.json" }],
  });
  expect(result).toContain("crosslinks[0]");
  expect(result).toContain("./missing-link.md");
  expect(result).toContain("structuredDocuments[0]");
  expect(result).toContain("./missing.json");
});

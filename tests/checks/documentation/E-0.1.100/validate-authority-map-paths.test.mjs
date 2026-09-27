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

import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readRegisteredRepositoryRoots } from "../../../../src/checks/documentation/E-0.1.100/read-registered-repository-roots.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("loads only registered repository paths from the authority registry", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-registered-roots-"));
  try {
    await mkdir(join(root, "specs"));
    await mkdir(join(root, "registry"));
    await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ globalAuthorityMap: "../registry/map.json" }));
    await writeFile(join(root, "registry", "map.json"), JSON.stringify({ repositoryRegistry: [
      { path: "../docs" }, { path: 42 }, {},
    ] }));
    const expected = [resolve(root, "docs")];
    await expect(readRegisteredRepositoryRoots(root)).resolves.toEqual(expected);
    await expect(readRegisteredRepositoryRoots(root, createRepositoryInventory(root))).resolves.toEqual(expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns no registry roots when authority or registry documents are unusable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-registered-roots-invalid-"));
  try {
    await mkdir(join(root, "specs"));
    const authorityPath = join(root, "specs", "authority.json");
    await writeFile(authorityPath, JSON.stringify({}));
    await expect(readRegisteredRepositoryRoots(root)).resolves.toBeNull();

    await writeFile(authorityPath, JSON.stringify({ globalAuthorityMap: "../registry/map.json" }));
    await mkdir(join(root, "registry"));
    await writeFile(join(root, "registry", "map.json"), JSON.stringify({}));
    await expect(readRegisteredRepositoryRoots(root)).resolves.toBeNull();

    await writeFile(join(root, "registry", "map.json"), "not json");
    await expect(readRegisteredRepositoryRoots(root)).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

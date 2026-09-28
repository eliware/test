import { expect, jest, test } from "@jest/globals";
import { createRepositoryDiscovery } from "../../src/checks/create-repository-inventory-discovery.mjs";
import { readdir, rm, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("defaults to lazy discovery and uses a supplied finder for full scans", async () => {
  const defaultReads = jest.fn(async () => []);
  const defaults = createRepositoryDiscovery({
    root: "/repo",
    readDirectory: defaultReads,
    statDirectory: async () => ({ dev: 1n, ino: 2n, size: 0n, mtimeNs: 1n, ctimeNs: 1n }),
  });
  expect(defaults.hasFullDiscovery()).toBe(false);
  await expect(defaults.entries()).resolves.toEqual([]);
  expect(defaults.hasFullDiscovery()).toBe(true);
  expect(defaultReads).toHaveBeenCalledWith(expect.stringMatching(/repo$/u), {
    withFileTypes: true,
  });

  const records = [{ path: "docs", type: "directory", depth: 1 }];
  const findEntries = jest.fn(async () => records);
  const discovery = createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
  });
  await expect(discovery.entries()).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo/docs")).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo")).resolves.toEqual(records);
  expect(findEntries).toHaveBeenCalledTimes(1);
});

test("refreshes full discovery when repository directories change on disk", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discovery-refresh-"));
  const discovery = createRepositoryDiscovery({ root, readDirectory: readdir });
  try {
    await expect(discovery.entries()).resolves.toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await writeFile(join(root, "added.mjs"), "export {};\n");
    await expect(discovery.entries()).resolves.toContainEqual(
      expect.objectContaining({ path: "added.mjs", type: "file" }),
    );

    await rm(join(root, "added.mjs"));
    await expect(discovery.entries()).resolves.not.toContainEqual(
      expect.objectContaining({ path: "added.mjs", type: "file" }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import { join } from "node:path";

export const repositoryDirectoryCacheRoot = join(process.cwd(), "inventory-fixture");
export const repositoryDirectoryMetadata = (mtimeNs) => ({
  dev: 1n,
  ino: 2n,
  size: 0n,
  mtimeMs: 1,
  ctimeMs: 1,
  mtimeNs,
  ctimeNs: mtimeNs,
  birthtimeNs: 3n,
});

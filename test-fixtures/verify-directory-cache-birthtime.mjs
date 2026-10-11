import { join } from "node:path";
import { createRepositoryDirectoryReadCache } from "../src/validation/shared/repository/create-repository-directory-read-cache.mjs";

export async function verifyDirectoryCacheBirthtimeRefresh(jest) {
  const root = join(process.cwd(), "inventory-fixture");
  const metadata = (mtimeNs) => ({ dev: 1n, ino: 2n, size: 0n, mtimeNs, ctimeNs: mtimeNs });
  const snapshot = (birthtimeNs) => ({ ...metadata(1n), birthtimeNs });
  const stat = jest
    .fn()
    .mockResolvedValueOnce(snapshot(1n))
    .mockResolvedValueOnce(snapshot(1n))
    .mockResolvedValueOnce(snapshot(2n))
    .mockResolvedValueOnce(snapshot(2n));
  const readDirectory = jest.fn().mockResolvedValueOnce(["old"]).mockResolvedValueOnce(["new"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  return { read, readDirectory };
}

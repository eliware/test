import { join } from "node:path";
import { readGeneratedDirectoryRecords } from "../../../read/generated-directory-records.mjs";

export async function readGeneratedDirectoryEntries({
  base,
  directory,
  prunedDirectory,
  children,
  root,
  statDirectory,
  readDirectory,
}) {
  if (!base || children.length || !prunedDirectory) return children;
  const metadata = await statDirectory(join(root, base), { bigint: true });
  if (!metadata.isDirectory()) {
    throw Object.assign(new Error(`ENOTDIR: not a directory, scandir '${directory}'`), {
      code: "ENOTDIR",
    });
  }
  return readGeneratedDirectoryRecords(base, readDirectory);
}

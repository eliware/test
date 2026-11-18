import { join } from "node:path";
import readGeneratedDirectoryRecords from "../../../read/generated-directory-records.mjs";
export default async function readGeneratedDirectoryEntries({
  base,
  directory,
  prunedDirectory,
  children,
  root,
  statDirectory,
  readDirectory,
}) {
  if (!base || children.length || !prunedDirectory) return children;
  let current = prunedDirectory;
  while (true) {
    const metadata = await statDirectory(join(root, current), {
      bigint: true,
    });
    if (!metadata.isDirectory()) {
      throw Object.assign(new Error(`ENOTDIR: not a directory, scandir '${directory}'`), {
        code: "ENOTDIR",
      });
    }
    if (current === base) break;
    const next = base.slice(current.length + 1).split("/")[0];
    current = `${current}/${next}`;
  }
  return readGeneratedDirectoryRecords(base, readDirectory);
}

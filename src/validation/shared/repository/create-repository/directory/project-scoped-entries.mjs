import { dirname } from "node:path";
import { projectRepositoryDirectoryRecords } from "../../project-repository-directory-records.mjs";

export async function projectScopedDirectoryEntries(directory, base, traversal, entriesUnder) {
  const records = await entriesUnder(directory, null, traversal);
  if (!records.some((record) => record.path === base)) {
    throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), {
      code: "ENOENT",
    });
  }
  return projectRepositoryDirectoryRecords(
    records.filter((record) => dirname(record.path).replaceAll("\\", "/") === base),
  );
}

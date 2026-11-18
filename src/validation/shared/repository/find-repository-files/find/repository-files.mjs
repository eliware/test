import { readdir } from "node:fs/promises";
import findRepositoryEntries from "../../find-repository-files.mjs";
export default async function findRepositoryFiles(root, readDirectory = readdir) {
  const entries = await findRepositoryEntries(root, readDirectory);
  return entries.filter(({ type }) => type === "file").map(({ path }) => path);
}

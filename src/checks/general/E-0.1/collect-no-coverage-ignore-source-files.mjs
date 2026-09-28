import { join } from "node:path";
import { findSourceFiles } from "./find-source-files.mjs";

const sourceExtension = /\.(?:mjs|js|cjs|ts|tsx)$/u;

export async function collectNoCoverageIgnoreSourceFiles(root, repositoryInventory) {
  const sourceRoot = join(root, "src");
  if (!repositoryInventory) return findSourceFiles(sourceRoot);
  const entries = await repositoryInventory.entriesUnder(sourceRoot);
  return entries
    .filter(({ path, type }) => type === "file" && sourceExtension.test(path))
    .map(({ path }) => join(root, path));
}

import { basename } from "node:path";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createDocumentationFileView(root, entriesUnder) {
  return async function documentationFiles({
    directory = root,
    predicate = () => true,
    maxDepth = 32,
    maxFiles = 10_000,
    includeGenerated = false,
  } = {}) {
    const base = inventoryDirectory(root, directory, "Documentation inventory directory must be inside the repository.");
    const prefix = base ? `${base}/` : "";
    const records = await entriesUnder(directory);
    const directories = records.filter(({ path, type }) => type === "directory" && (includeGenerated || !generatedPath.test(path)));
    if (base && !directories.some(({ path }) => path === base))
      throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), { code: "ENOENT" });
    const exceedsDepth = directories.some(({ path }) => {
      if (base && path === base) return false;
      const relativePath = base ? path.slice(prefix.length) : path;
      return relativePath.split("/").length > maxDepth;
    });
    if (exceedsDepth)
      throw new Error(`Documentation traversal exceeded the ${maxDepth}-level depth limit.`);
    const result = [];
    for (const record of records) {
      if (record.type !== "file" || !record.path.startsWith(prefix) || (!includeGenerated && generatedPath.test(record.path))) continue;
      const file = record.path.slice(prefix.length);
      if (!predicate(basename(file))) continue;
      result.push(file);
      if (result.length > maxFiles) throw new Error(`Documentation traversal exceeded the ${maxFiles}-file limit.`);
    }
    return result;
  };
}

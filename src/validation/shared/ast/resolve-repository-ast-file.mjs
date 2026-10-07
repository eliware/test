import { join, resolve } from "node:path";
import { inventoryDirectory, inventoryPath } from "../repository/repository-inventory-paths.mjs";

export function resolveRepositoryAstFile(root, file) {
  const repositoryFile = inventoryDirectory(
    root,
    inventoryPath(root, file),
    "AST source file must be inside the repository.",
  );
  return { repositoryFile, absoluteFile: join(resolve(root), repositoryFile) };
}

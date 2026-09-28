import { findRepositoryFiles } from "../find-repository-files.mjs";
import { scanSourceDependencyFiles } from "./scan-source-dependency-files.mjs";
import { scanStructuredDependencyFiles } from "./scan-structured-dependency-files.mjs";

export async function scanDependencyFiles(
  root,
  declared,
  referenced,
  uncertain,
  repositoryFiles = null,
  parseAst = null,
  inventory = null,
  dependencyBinaries = new Map(),
) {
  const files = repositoryFiles ?? (await findRepositoryFiles(root));
  const sourceFiles = repositoryFiles
    ? files.filter((file) => file.startsWith("src/") || file.startsWith(".knit/"))
    : files;

  await scanSourceDependencyFiles(
    root,
    sourceFiles,
    declared,
    referenced,
    uncertain,
    parseAst,
    dependencyBinaries,
  );
  await scanStructuredDependencyFiles(root, files, declared, referenced, inventory);
}

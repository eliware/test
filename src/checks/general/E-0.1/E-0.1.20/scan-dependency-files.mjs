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
) {
  const files = repositoryFiles ?? await findRepositoryFiles(root);
  const sourceFiles = repositoryFiles ? files.filter((file) => file.startsWith("src/")) : files;

  await scanSourceDependencyFiles(
    root,
    sourceFiles,
    declared,
    referenced,
    uncertain,
    parseAst,
  );
  await scanStructuredDependencyFiles(root, files, declared, referenced, inventory);
}

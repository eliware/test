import { validateNestedGitIgnoreFiles } from "./nested-gitignore-files.mjs";
import { validateTrackedIgnoredPaths } from "./tracked-ignored-paths.mjs";

export async function validateGitIgnoreFiles(root, runGit, isPathExempt = () => false) {
  return [
    ...(await validateNestedGitIgnoreFiles(root, runGit, isPathExempt)),
    ...(await validateTrackedIgnoredPaths(root, runGit, isPathExempt)),
  ];
}

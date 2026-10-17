import { validateNestedGitIgnoreFiles } from "./nested-gitignore-files.mjs";
import { validateTrackedIgnoredPaths } from "./tracked-ignored-paths.mjs";

export async function validateGitIgnoreFiles(root, runGit) {
  return [
    ...(await validateNestedGitIgnoreFiles(root, runGit)),
    ...(await validateTrackedIgnoredPaths(root, runGit)),
  ];
}

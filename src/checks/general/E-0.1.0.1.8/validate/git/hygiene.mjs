import { defaultGitRunner } from "./default-runner.mjs";
import { validateGitIgnoreProbes } from "./ignore/probes.mjs";
import { validateNestedGitIgnoreFiles } from "./ignore/nested-gitignore-files.mjs";
import { validateGitIgnoreRequiredRules } from "./ignore/required-rules.mjs";
import { validateTrackedPaths } from "./tracked-paths.mjs";

export async function validateGitHygiene(
  root,
  runGit = defaultGitRunner,
  { readText, isPathExempt } = {},
) {
  const errors = await validateGitIgnoreRequiredRules(root, readText);
  errors.push(...(await validateGitIgnoreProbes(root, runGit)));
  errors.push(...(await validateNestedGitIgnoreFiles(root, runGit, isPathExempt)));
  errors.push(...(await validateTrackedPaths(root, runGit, isPathExempt)));
  return errors;
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateGitIgnoreProbes } from "./ignore/probes.mjs";
import { validateGitIgnoreFiles } from "./ignore/files.mjs";
import { validateGitIgnoreRequiredRules } from "./ignore/required-rules.mjs";
import { validateTrackedSymlinks } from "../tracked/symlinks.mjs";
import { validateTrackedSensitivePaths } from "../tracked/sensitive-paths.mjs";

const executeFile = promisify(execFile);

export async function validateGitHygiene(
  root,
  runGit = executeFile,
  { readText, isPathExempt } = {},
) {
  const errors = await validateGitIgnoreRequiredRules(root, readText);
  errors.push(...(await validateGitIgnoreProbes(root, runGit)));
  errors.push(...(await validateGitIgnoreFiles(root, runGit)));
  errors.push(...(await validateTrackedSymlinks(root, runGit, isPathExempt)));
  errors.push(...(await validateTrackedSensitivePaths(root, runGit, isPathExempt)));
  return errors;
}

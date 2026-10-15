import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { validateRequiredIgnoreRules } from "../ignore-patterns.mjs";
import { validateGitIgnoreProbes } from "./ignore/probes.mjs";
import { validateGitIgnoreFiles } from "./ignore/files.mjs";
import { validateTrackedSymlinks } from "../tracked-symlinks.mjs";
import { validateTrackedSensitivePaths } from "../tracked-sensitive-paths.mjs";

const executeFile = promisify(execFile);

export async function validateGitHygiene(root, runGit = executeFile, { readText = readFile } = {}) {
  const errors = [];
  try {
    errors.push(...validateRequiredIgnoreRules(await readText(`${root}/.gitignore`, "utf8")));
  } catch {
    errors.push(".gitignore could not be read to check required ignore rules.");
  }
  errors.push(...(await validateGitIgnoreProbes(root, runGit)));
  errors.push(...(await validateGitIgnoreFiles(root, runGit)));
  errors.push(...(await validateTrackedSymlinks(root, runGit)));
  errors.push(...(await validateTrackedSensitivePaths(root, runGit)));
  return errors;
}

import { validateTrackedIgnoredPaths } from "./ignore/tracked-ignored-paths.mjs";
import { validateTrackedSensitivePaths } from "../tracked/sensitive-paths.mjs";
import { validateTrackedSymlinks } from "../tracked/symlinks.mjs";

export async function validateTrackedPaths(root, runGit, isPathExempt) {
  return [
    ...(await validateTrackedIgnoredPaths(root, runGit, isPathExempt)),
    ...(await validateTrackedSymlinks(root, runGit, isPathExempt)),
    ...(await validateTrackedSensitivePaths(root, runGit, isPathExempt)),
  ];
}

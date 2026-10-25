import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readReleaseTags } from "./read-release-tags.mjs";
import { releaseVersionFromHeading } from "./notes/version/from-heading.mjs";

const executeFile = promisify(execFile);

export async function validateReleaseTagVersions(
  root,
  entries,
  packageVersion,
  runGit = executeFile,
) {
  if (typeof packageVersion !== "string" || !packageVersion) return [];
  const historicalVersions = [
    ...new Set(
      entries
        .map(releaseVersionFromHeading)
        .filter((version) => version && version !== packageVersion),
    ),
  ];
  if (!historicalVersions.length) return [];

  const result = await readReleaseTags(root, runGit);
  if (result.error) return [result.error];
  return historicalVersions
    .filter((version) => !result.tags.has(`v${version}`))
    .map((version) => `RELEASE_NOTES.md version ${version} requires repository tag v${version}.`);
}

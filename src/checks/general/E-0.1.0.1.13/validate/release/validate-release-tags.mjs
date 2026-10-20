import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { releaseVersionFromHeading } from "./version-history.mjs";

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

  let stdout;
  try {
    const history = await runGit("git", ["-C", root, "rev-parse", "--is-shallow-repository"], {
      encoding: "utf8",
      windowsHide: true,
    });
    if (String(history.stdout).trim() === "true")
      return ["Full Git tag history is required for release-note validation."];
    ({ stdout } = await runGit("git", ["-C", root, "tag", "--list"], {
      encoding: "utf8",
      windowsHide: true,
    }));
  } catch {
    return ["Repository tags could not be read for release-note validation."];
  }

  const tags = new Set(String(stdout).split(/\r?\n/u));
  return historicalVersions
    .filter((version) => !tags.has(`v${version}`))
    .map((version) => `RELEASE_NOTES.md version ${version} requires repository tag v${version}.`);
}

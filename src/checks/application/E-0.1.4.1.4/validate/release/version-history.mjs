import { compareReleaseVersions, isValidReleaseDate } from "./notes/version-order.mjs";

const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;

export function releaseVersionFromHeading(entry) {
  return versionHeading.exec(entry)?.[1] ?? null;
}

export function validateReleaseVersionHistory(entries, packageVersion) {
  const errors = [];
  const newestVersion = releaseVersionFromHeading(entries[0] ?? "");
  if (typeof packageVersion !== "string" || !packageVersion)
    errors.push("package.json.version is required for release-note validation.");
  else if (newestVersion && newestVersion !== packageVersion)
    errors.push(
      `Newest release version ${newestVersion} must match package.json.version ${packageVersion}.`,
    );
  const versions = [];
  const dates = [];
  for (const entry of entries) {
    const match = versionHeading.exec(entry);
    if (!match) {
      errors.push(`Malformed release entry: ${entry}.`);
      continue;
    }
    const [, version, date] = match;
    if (!isValidReleaseDate(date)) errors.push(`Release date is invalid: ${date}.`);
    versions.push(version);
    dates.push(date);
  }
  if (new Set(versions).size !== versions.length)
    errors.push("RELEASE_NOTES.md must not duplicate release versions.");
  for (let index = 1; index < versions.length; index++) {
    if (compareReleaseVersions(versions[index - 1], versions[index]) <= 0)
      errors.push("Release versions must be in strictly descending SemVer order.");
    if (dates[index - 1] < dates[index]) errors.push("Release dates must not increase.");
  }
  return errors;
}

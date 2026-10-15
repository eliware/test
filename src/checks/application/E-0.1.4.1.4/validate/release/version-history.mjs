const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;

export function validateReleaseVersionHistory(entries, packageVersion) {
  const errors = [];
  const newestVersion = versionHeading.exec(entries[0] ?? "")?.[1];
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
    if (!validDate(date)) errors.push(`Release date is invalid: ${date}.`);
    versions.push(version);
    dates.push(date);
  }
  if (new Set(versions).size !== versions.length)
    errors.push("RELEASE_NOTES.md must not duplicate release versions.");
  for (let index = 1; index < versions.length; index++) {
    if (compareVersions(versions[index - 1], versions[index]) <= 0)
      errors.push("Release versions must be in strictly descending SemVer order.");
    if (dates[index - 1] < dates[index]) errors.push("Release dates must not increase.");
  }
  return errors;
}

function validDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(BigInt);
  const rightParts = right.split(".").map(BigInt);
  for (let index = 0; index < leftParts.length; index++)
    if (leftParts[index] !== rightParts[index])
      return leftParts[index] > rightParts[index] ? 1 : -1;
  return 0;
}

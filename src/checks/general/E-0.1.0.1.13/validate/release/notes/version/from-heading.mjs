const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;

export function parseReleaseVersionHeading(entry) {
  return versionHeading.exec(entry);
}

export function releaseVersionFromHeading(entry) {
  return parseReleaseVersionHeading(entry)?.[1] ?? null;
}

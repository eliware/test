const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;
function parseReleaseVersionHeading(entry) {
  return versionHeading.exec(entry);
}
function releaseVersionFromHeading(entry) {
  return parseReleaseVersionHeading(entry)?.[1] ?? null;
}
export default releaseVersionFromHeading;

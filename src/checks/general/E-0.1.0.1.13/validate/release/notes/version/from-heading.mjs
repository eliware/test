const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;
export default function parseReleaseVersionHeading(entry) {
  return versionHeading.exec(entry);
}

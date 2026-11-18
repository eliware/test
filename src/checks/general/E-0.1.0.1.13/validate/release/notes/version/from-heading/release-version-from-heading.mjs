import parseReleaseVersionHeading from "../from-heading.mjs";
function releaseVersionFromHeading(entry) {
  return parseReleaseVersionHeading(entry)?.[1] ?? null;
}
export default releaseVersionFromHeading;

import getTestToolReferenceChecker from "./dispatch.mjs";
export default function hasProhibitedTestToolReference(path, content, harness) {
  return getTestToolReferenceChecker(path)?.(content, harness) ?? false;
}

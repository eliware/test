import { getTestToolReferenceChecker } from "./dispatch.mjs";

export function hasProhibitedTestToolReference(path, content, harness) {
  return getTestToolReferenceChecker(path)?.(content, harness) ?? false;
}

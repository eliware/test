import { hasProhibitedTestToolReference } from "./test-tool-references/policy.mjs";

export function validateTestToolReferences(path, content, harness = false) {
  const prohibited = hasProhibitedTestToolReference(path, content, harness);
  return prohibited ? `${path} must not import or invoke a test runner or coverage tool.` : null;
}

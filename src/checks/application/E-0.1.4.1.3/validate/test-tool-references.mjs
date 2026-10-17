import { detectTestToolUse } from "../detect-test-tool-use.mjs";
import { findTestToolReferencesInText } from "./find-test-tool-references-in-text.mjs";
import { withoutJestConfiguration } from "./without-jest-configuration.mjs";

export function validateTestToolReferences(path, content, harness = false) {
  const candidate = path === "package.json" ? withoutJestConfiguration(content) : content;
  const plainText =
    path === "package.json" ||
    /\.(?:json|ya?ml|sh|ps1|py)$/iu.test(path) ||
    !/\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx)$/iu.test(path);
  const referencesTool = plainText
    ? findTestToolReferencesInText(candidate, harness)
    : detectTestToolUse(candidate, harness);
  return referencesTool
    ? `${path} must not import or invoke a test runner or coverage tool.`
    : null;
}

import { detectTestToolUse } from "../detect-test-tool-use.mjs";
import { findTestToolReferencesInText } from "./find-test-tool-references-in-text.mjs";
import { hasProhibitedMarkdownCommandReferences } from "./test-tool-references/markdown/command-references.mjs";
import { hasProhibitedPackageScriptReferences } from "./test-tool-references/package-script/references.mjs";
import { hasProhibitedYamlCommandReferences } from "./test-tool-references/yaml/command-references.mjs";

export function validateTestToolReferences(path, content, harness = false) {
  const prohibited = isJsonFile(path)
    ? hasProhibitedPackageScriptReferences(content, harness)
    : isYamlFile(path)
      ? hasProhibitedYamlCommandReferences(content, harness)
      : isScriptFile(path)
        ? findTestToolReferencesInText(content, harness)
        : isMarkdownFile(path)
          ? hasProhibitedMarkdownCommandReferences(content, harness)
          : isCodeFile(path)
            ? detectTestToolUse(content, harness)
            : false;
  return prohibited ? `${path} must not import or invoke a test runner or coverage tool.` : null;
}

function isJsonFile(path) {
  return path === "package.json";
}

function isYamlFile(path) {
  return /\.ya?ml$/iu.test(path);
}

function isScriptFile(path) {
  return /\.(?:sh|ps1|py)$/iu.test(path);
}

function isMarkdownFile(path) {
  return /\.md$/iu.test(path);
}

function isCodeFile(path) {
  return /\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx)$/iu.test(path);
}

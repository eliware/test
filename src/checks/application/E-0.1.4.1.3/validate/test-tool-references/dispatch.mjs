import { detectTestToolUse } from "../../detect-test-tool-use.mjs";
import { findTestToolReferencesInText } from "../find-test-tool-references-in-text.mjs";
import { hasProhibitedMarkdownCommandReferences } from "./markdown/command-references.mjs";
import { hasProhibitedPackageScriptReferences } from "./package-script/references.mjs";
import { hasProhibitedYamlCommandReferences } from "./yaml/command-references.mjs";

export function getTestToolReferenceChecker(path) {
  if (path === "package.json") return hasProhibitedPackageScriptReferences;
  if (/\.ya?ml$/iu.test(path)) return hasProhibitedYamlCommandReferences;
  if (/\.(?:sh|ps1|py)$/iu.test(path)) return findTestToolReferencesInText;
  if (/\.md$/iu.test(path)) return hasProhibitedMarkdownCommandReferences;
  if (/\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx)$/iu.test(path)) return detectTestToolUse;
  return null;
}

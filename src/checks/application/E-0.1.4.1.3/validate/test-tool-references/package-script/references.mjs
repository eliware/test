import { extractPackageScriptCommands } from "./commands.mjs";
import { findTestToolReferencesInText } from "../../find-test-tool-references-in-text.mjs";

export function hasProhibitedPackageScriptReferences(content, harness = false) {
  return extractPackageScriptCommands(content).some((command) =>
    findTestToolReferencesInText(command, harness),
  );
}

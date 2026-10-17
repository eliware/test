import { extractYamlCommands } from "./commands.mjs";
import { findTestToolReferencesInText } from "../../find-test-tool-references-in-text.mjs";

export function hasProhibitedYamlCommandReferences(content, harness = false) {
  return findTestToolReferencesInText(extractYamlCommands(content), harness);
}

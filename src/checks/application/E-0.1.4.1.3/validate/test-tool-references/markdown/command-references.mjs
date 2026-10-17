import { extractMarkdownShellCommands } from "./shell-commands.mjs";
import { findTestToolReferencesInText } from "../../find-test-tool-references-in-text.mjs";

export function hasProhibitedMarkdownCommandReferences(content, harness = false) {
  return findTestToolReferencesInText(extractMarkdownShellCommands(content), harness);
}

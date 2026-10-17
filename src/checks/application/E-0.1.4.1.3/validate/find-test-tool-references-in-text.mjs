import { isTestToolCommand } from "../test-tool-patterns.mjs";

export function findTestToolReferencesInText(content, harness = false) {
  return content.split(/\r?\n/u).some((line) => {
    const command = line.trim();
    return command && !command.startsWith("#") && !command.startsWith("//")
      ? isTestToolCommand(command, harness)
      : false;
  });
}

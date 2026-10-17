import { hasAlternativeToolCommand } from "../has-alternative-tool-command.mjs";

export function validateApplicationTestToolScripts(packageJson = {}) {
  return Object.entries(packageJson.scripts ?? {})
    .filter(([, command]) => typeof command === "string" && hasAlternativeToolCommand(command))
    .map(
      ([name]) => `package.json script ${name} must not invoke a separate test or coverage tool.`,
    );
}

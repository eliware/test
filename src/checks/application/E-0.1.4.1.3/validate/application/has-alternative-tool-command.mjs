import { hasAlternativePackageScriptCommand } from "../../command-patterns/recognize/package-script.mjs";

export function hasAlternativeToolCommand(command) {
  return hasAlternativePackageScriptCommand(command);
}

import hasAlternativePackageScriptCommand from "../../command-patterns/recognize/package-script.mjs";
export default function hasAlternativeToolCommand(command) {
  return hasAlternativePackageScriptCommand(command);
}

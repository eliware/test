export function buildNpmScriptArguments(scriptName) {
  return ["run", scriptName, "--silent"];
}

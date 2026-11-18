export default function buildNpmScriptArguments(scriptName) {
  return ["run", scriptName, "--silent"];
}

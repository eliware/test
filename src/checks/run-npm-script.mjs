import { spawn } from "node:child_process";
import { buildNpmScriptArguments } from "./build-npm-script-arguments.mjs";
import { execute } from "./execute-child-process.mjs";
import { npmCommand } from "./npm-command.mjs";

export async function runNpmScript(root, scriptName, run, spawnProcess = spawn) {
  const [command, prefix] = npmCommand();
  const executeScript = run ?? ((...args) => execute(...args, spawnProcess));
  return executeScript(command, [...prefix, ...buildNpmScriptArguments(scriptName)], { cwd: root });
}

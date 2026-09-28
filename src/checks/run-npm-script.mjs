import { spawn } from "node:child_process";
import { buildNpmScriptArguments } from "./build-npm-script-arguments.mjs";
import { execute } from "./execute-child-process.mjs";
import { npmCommand } from "./npm-command.mjs";

export async function runNpmScript(
  root,
  scriptName,
  run,
  spawnProcess = spawn,
  env = process.env,
  platform = process.platform,
  execPath = process.execPath,
) {
  const [command, prefix] = npmCommand(
    platform,
    env?.npm_execpath ?? "",
    execPath,
    undefined,
    root,
  );
  const executeScript = run ?? ((...args) => execute(...args, spawnProcess));
  return executeScript(command, [...prefix, ...buildNpmScriptArguments(scriptName)], {
    cwd: root,
    env: { ...env },
  });
}

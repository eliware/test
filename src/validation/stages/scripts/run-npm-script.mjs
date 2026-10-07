import { spawn } from "node:child_process";
import { buildNpmScriptArguments } from "./build-npm-script-arguments.mjs";
import { execute } from "../../shared/process/execute-child-process.mjs";
import { npmCommand } from "../../shared/process/npm-command.mjs";

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
    env?.PATH ?? env?.Path,
  );
  const executeScript = run ?? ((...args) => execute(...args, spawnProcess));
  return executeScript(command, [...prefix, ...buildNpmScriptArguments(scriptName)], {
    cwd: root,
    env: { ...env },
  });
}

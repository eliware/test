import { npmCommand } from "../../shared/process/npm-command.mjs";

export function resolveAuditExecutable({
  env = process.env,
  platform = process.platform,
  execPath = process.execPath,
  root = process.cwd(),
} = {}) {
  return npmCommand(
    platform,
    env.npm_execpath ?? "",
    execPath,
    undefined,
    root,
    env.PATH ?? env.Path,
  );
}

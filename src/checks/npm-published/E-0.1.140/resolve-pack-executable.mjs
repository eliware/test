import { npmCommand } from "../../npm-command.mjs";

export function resolvePackExecutable(
  env = process.env,
  platform = process.platform,
  execPath = process.execPath,
  root = process.cwd(),
) {
  return npmCommand(platform, env.npm_execpath ?? "", execPath, undefined, root);
}

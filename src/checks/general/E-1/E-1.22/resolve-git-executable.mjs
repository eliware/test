import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

export function resolveGitExecutable({ platform = process.platform, env = process.env, exists = existsSync } = {}) {
  if (platform !== "win32") return "git";
  const searchDirectories = [
    ...(env.Path ?? env.PATH ?? "").split(delimiter).filter(Boolean),
    env.ProgramFiles && join(env.ProgramFiles, "Git", "cmd"),
    env["ProgramFiles(x86)"] && join(env["ProgramFiles(x86)"], "Git", "cmd"),
    env.LOCALAPPDATA && join(env.LOCALAPPDATA, "Programs", "Git", "cmd"),
  ].filter(Boolean);
  for (const directory of searchDirectories) {
    const candidate = join(directory, "git.exe");
    if (exists(candidate)) return candidate;
  }
  return "git.exe";
}

import { existsSync } from "node:fs";
import { win32 } from "node:path";

export function resolveGitExecutable({ platform = process.platform, env = process.env, exists = existsSync } = {}) {
  if (platform !== "win32") return "git";
  const searchDirectories = [
    ...(env.Path ?? env.PATH ?? "").split(win32.delimiter).filter(Boolean),
    env.ProgramFiles && win32.join(env.ProgramFiles, "Git", "cmd"),
    env["ProgramFiles(x86)"] && win32.join(env["ProgramFiles(x86)"], "Git", "cmd"),
    env.LOCALAPPDATA && win32.join(env.LOCALAPPDATA, "Programs", "Git", "cmd"),
  ].filter(Boolean);
  for (const directory of searchDirectories) {
    const candidate = win32.join(directory, "git.exe");
    if (exists(candidate)) return candidate;
  }
  return "git.exe";
}

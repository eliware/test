import { existsSync } from "node:fs";
import { win32 } from "node:path";

export function resolveGitExecutable({
  platform = process.platform,
  env = process.env,
  exists = existsSync,
} = {}) {
  if (platform !== "win32") return "git";
  const searchDirectories = [
    ...[env.Path, env.PATH].filter((value) => typeof value === "string")
      .flatMap((value) => value.split(win32.delimiter).filter(Boolean)),
    env.ProgramFiles && win32.join(env.ProgramFiles, "Git", "cmd"),
    env.ProgramFiles && win32.join(env.ProgramFiles, "Git", "bin"),
    env.ProgramW6432 && win32.join(env.ProgramW6432, "Git", "cmd"),
    env.ProgramW6432 && win32.join(env.ProgramW6432, "Git", "bin"),
    env["ProgramFiles(x86)"] && win32.join(env["ProgramFiles(x86)"], "Git", "cmd"),
    env["ProgramFiles(x86)"] && win32.join(env["ProgramFiles(x86)"], "Git", "bin"),
    env.LOCALAPPDATA && win32.join(env.LOCALAPPDATA, "Programs", "Git", "cmd"),
    env.LOCALAPPDATA && win32.join(env.LOCALAPPDATA, "Programs", "Git", "bin"),
  ].filter(Boolean);
  for (const directory of searchDirectories) {
    const candidate = win32.join(directory, "git.exe");
    if (exists(candidate)) return candidate;
  }
  return "git.exe";
}

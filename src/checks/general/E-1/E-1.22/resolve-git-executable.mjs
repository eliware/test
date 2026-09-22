export function resolveGitExecutable({ platform = process.platform } = {}) {
  return platform === "win32" ? "git.exe" : "git";
}

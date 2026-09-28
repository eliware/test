const allowedExecutables = new Set(["node", "npm", "npx", "git", "echo"]);

export function normalizeKnitExecutable(command) {
  if (typeof command !== "string" || !command) return null;
  const normalized = command.replaceAll("\\", "/");
  let executable = normalized;
  if (normalized.includes("/")) {
    const isDrivePath = /^[a-z]:\//iu.test(normalized);
    const isUncPath = normalized.startsWith("//");
    if (!isDrivePath && !isUncPath) return null;
    const pathParts = normalized.slice(isDrivePath ? 3 : 2).split("/");
    if (
      pathParts.length < (isDrivePath ? 1 : 3) ||
      pathParts.some((part) => !part || part === "." || part === "..")
    )
      return null;
    if (!/\.(?:cmd|exe|bat)$/iu.test(pathParts.at(-1))) return null;
    const standardGit = /^program files\/git\/(?:cmd|bin)\/git\.exe$/iu;
    const standardNode = /^program files(?: \(x86\))?\/nodejs\/(?:npm|npx)\.cmd$/iu;
    const userNpmShim = /^users\/[^/]+\/appdata\/roaming\/npm\/(?:npm|npx)\.cmd$/iu;
    const uncInstall =
      /^\/\/[^/]+\/(?:tools\/)?program files(?: \(x86\))?\/(?:git\/(?:cmd|bin)\/git\.exe|nodejs\/(?:npm|npx)\.cmd)$/iu;
    const installedPath = pathParts.join("/");
    if (
      !(isUncPath && uncInstall.test(normalized)) &&
      !standardGit.test(installedPath) &&
      !standardNode.test(installedPath) &&
      !userNpmShim.test(installedPath)
    )
      return null;
    executable = pathParts.at(-1);
  }
  return normalizeAllowedBaseName(executable);
}

function normalizeAllowedBaseName(command) {
  const executable = command.toLowerCase().replace(/\.(?:cmd|exe|bat)$/u, "");
  return allowedExecutables.has(executable) ? executable : null;
}

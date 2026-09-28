const allowedExecutables = new Set(["node", "npm", "npx", "git", "echo"]);
const windowsRoot = String.raw`(?:[a-z]:|//[^/]+/[^/]+|//\?/UNC/[^/]+/[^/]+|//\?/[a-z]:)`;
const windowsInstallPaths = [
  new RegExp(`^(${windowsRoot}/Program Files(?: \\(x86\\))?/nodejs)/(npm|npx)\\.cmd$`, "iu"),
  new RegExp(`^${windowsRoot}/Program Files/Git/(?:cmd|bin)/git\\.exe$`, "iu"),
];

export function normalizeKnitExecutable(command) {
  if (typeof command !== "string" || !command) return null;
  const normalized = command.replaceAll("\\", "/");
  if (!normalized.includes("/")) return normalizeAllowedBaseName(normalized);
  for (const [index, pattern] of windowsInstallPaths.entries()) {
    const match = normalized.match(pattern);
    if (match) return index === 0 ? match[2].toLowerCase() : "git";
  }
  return null;
}

function normalizeAllowedBaseName(command) {
  const executable = command.toLowerCase().replace(/\.(?:cmd|exe|bat)$/u, "");
  return allowedExecutables.has(executable) ? executable : null;
}

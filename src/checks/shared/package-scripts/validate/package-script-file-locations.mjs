import { posix } from "node:path";

const directScriptInvocation =
  /^(?:(?:node(?:\.exe)?|bun(?:\.exe)?|deno(?:\.exe)?|tsx|ts-node|python3?|py|bash|sh|pwsh|powershell)\s+)?["']?((?:\.{1,2}[\\/])?[\w.-]+(?:[\\/][\w.-]+)*\.(?:mjs|cjs|js|mts|cts|ts|py|sh|ps1|bat|cmd))["']?(?:\s|$)/iu;

export function validatePackageScriptFileLocations(packageJson = {}) {
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return [];
  return Object.entries(scripts).flatMap(([name, command]) => {
    if (typeof command !== "string") return [];
    const match = command.match(directScriptInvocation);
    if (!match) return [];
    const filename = posix.basename(match[1]);
    if (!/(?:^|[-.])(?:validate|validator|check|preflight|verify|audit)(?:[-.]|$)/iu.test(filename))
      return [];
    const path = posix.normalize(match[1].replaceAll("\\", "/").replace(/^\.\//u, ""));
    if (path.startsWith("scripts/") || path.startsWith("bin/")) return [];
    return [`package.json.scripts.${name} must keep local validator files under scripts/.`];
  });
}

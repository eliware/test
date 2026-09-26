const profiles = new Set(["general", "application", "cli", "web", "discord", "mcp-server", "library", "documentation", "workspace", "infrastructure", "npm-published", "ghcr-published", "private", "fork"]);

export function validatePackageProfileSelection(packageJson) {
  const apply = packageJson?.eliware?.apply;
  if (!Array.isArray(apply) || apply.length === 0 || apply.some((profile) => typeof profile !== "string" || !profiles.has(profile))) return "package.json.eliware.apply must contain only known nonempty convention profiles.";
  return null;
}

export function validateStartCommand(packageJson, entrypoints) {
  if (packageJson.scripts?.start === undefined) return null;
  const start = packageJson.scripts.start;
  if (typeof start !== "string") return "package.json start must be a command string.";
  const tokens = start.match(/(?:"[^"]*"|'[^']*'|[^\s]+)/gu) ?? [];
  const normalized = tokens.map((token) => canonicalToken(token.replace(/^['"]|['"]$/gu, "")));
  const declared = entrypoints.filter((target) => typeof target === "string").map(canonicalToken);
  return declared.some((target) => normalized.includes(target))
    ? null
    : "package.json start must contain a standalone token for a declared entrypoint.";
}

function canonicalToken(value) {
  const path = value.replaceAll("\\", "/").replace(/^\.\//u, "");
  return path.split("/").some((segment) => segment === ".." || segment === ".") ? value : path;
}

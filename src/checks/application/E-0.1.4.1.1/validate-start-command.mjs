export function validateStartCommand(packageJson, entrypoints) {
  if (packageJson.scripts?.start === undefined) return null;
  const start = packageJson.scripts.start;
  if (typeof start !== "string") return "package.json start must be a command string.";
  const tokens = start.match(/(?:"[^"]*"|'[^']*'|[^\s]+)/gu) ?? [];
  const normalized = tokens.map((token) =>
    token.replace(/^['"]|['"]$/gu, "").replace(/^\.\//u, ""),
  );
  const declared = entrypoints
    .filter((target) => typeof target === "string")
    .map((target) => target.replace(/^\.\//u, ""));
  return declared.some((target) => normalized.includes(target))
    ? null
    : "package.json start must contain a standalone token for a declared entrypoint.";
}

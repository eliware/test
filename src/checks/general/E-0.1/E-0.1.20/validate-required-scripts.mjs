const requiredScripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

export function validateRequiredScripts(
  scripts,
  { requiresPack = false, allowedAdditionalScripts = [] } = {},
) {
  if (scripts === null || typeof scripts !== "object" || Array.isArray(scripts)) {
    return "package.json.scripts must be an object.";
  }
  const applicableScripts = requiresPack
    ? { ...requiredScripts, pack: "eliware-test --pack" }
    : requiredScripts;
  for (const [name, command] of Object.entries(applicableScripts)) {
    if (scripts?.[name] !== command) return `package.json.scripts.${name} must be exactly ${command}.`;
  }
  const allowedNames = new Set([...Object.keys(applicableScripts), ...allowedAdditionalScripts]);
  for (const [name, command] of Object.entries(scripts)) {
    if (!allowedNames.has(name)) return `package.json.scripts.${name} is not allowed by an applicable profile.`;
    if (typeof command !== "string" || !command.trim()) {
      return `package.json.scripts.${name} must be a nonempty command.`;
    }
  }
  return null;
}

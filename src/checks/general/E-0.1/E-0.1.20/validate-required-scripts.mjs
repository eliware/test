const requiredScripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

export function validateRequiredScripts(
  scripts,
  { requiresPack = false, allowedAdditionalScripts = [], selfHosted = false } = {},
) {
  if (scripts === null || typeof scripts !== "object" || Array.isArray(scripts)) {
    return "package.json.scripts must be an object.";
  }
  const canonicalScripts = requiresPack
    ? { ...requiredScripts, pack: "eliware-test --pack" }
    : requiredScripts;
  const applicableScripts = selfHosted
    ? Object.fromEntries(
        Object.keys(canonicalScripts).map((name) => [
          name,
          name === "test"
            ? "node bin/eliware-test.mjs"
            : `node bin/eliware-test.mjs --${name === "format:check" ? "format-check" : name}`,
        ]),
      )
    : canonicalScripts;
  for (const [name, command] of Object.entries(applicableScripts)) {
    if (scripts?.[name] !== command)
      return `package.json.scripts.${name} must be exactly ${command}.`;
  }
  const allowedNames = new Set([...Object.keys(applicableScripts), ...allowedAdditionalScripts]);
  for (const [name, command] of Object.entries(scripts)) {
    if (!allowedNames.has(name))
      return `package.json.scripts.${name} is not allowed by an applicable profile.`;
    if (typeof command !== "string" || !command.trim()) {
      return `package.json.scripts.${name} must be a nonempty command.`;
    }
  }
  return null;
}

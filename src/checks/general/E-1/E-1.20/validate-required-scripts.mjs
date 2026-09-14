const requiredScripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

export function validateRequiredScripts(scripts) {
  for (const [name, command] of Object.entries(requiredScripts)) {
    if (scripts?.[name] !== command) return `package.json.scripts.${name} must be exactly ${command}.`;
  }
  return null;
}

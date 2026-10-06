const consumerScripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};
const selfScripts = {
  test: "node bin/eliware-test.mjs",
  lint: "node bin/eliware-test.mjs --lint",
  audit: "node bin/eliware-test.mjs --audit",
  format: "node bin/eliware-test.mjs --format",
  "format:check": "node bin/eliware-test.mjs --format-check",
};

export function validatePackageScripts(packageJson = {}) {
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts))
    return ["package.json.scripts must be an object."];
  const required = packageJson.name === "@eliware/test" ? selfScripts : consumerScripts;
  const errors = [];
  for (const [name, command] of Object.entries(required))
    if (scripts[name] !== command) errors.push(`package.json.scripts.${name} must be ${command}.`);
  for (const [name, command] of Object.entries(scripts)) {
    if (Object.hasOwn(required, name)) continue;
    if (typeof command !== "string" || !command.trim())
      errors.push(`package.json.scripts.${name} must be a nonempty command.`);
    else if (/\b(?:npm\s+publish|docker\s+push|ghcr\.io)\b/iu.test(command))
      errors.push(`package.json.scripts.${name} must not publish packages or images.`);
  }
  return errors;
}

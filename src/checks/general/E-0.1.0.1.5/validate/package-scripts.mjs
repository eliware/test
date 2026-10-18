import { hasPackagePublicationCommand } from "./has-package-publication-command.mjs";

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
const selfRepository = "git+https://github.com/eliware/test.git";

export function validatePackageScripts(packageJson = {}) {
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts))
    return ["package.json.scripts must be an object."];
  const isSelf =
    packageJson.name === "@eliware/test" && packageJson.repository?.url === selfRepository;
  const required = isSelf ? selfScripts : consumerScripts;
  const errors = [];
  for (const [name, command] of Object.entries(required))
    if (scripts[name] !== command) errors.push(`package.json.scripts.${name} must be ${command}.`);
  for (const [name, command] of Object.entries(scripts)) {
    if (Object.hasOwn(required, name)) continue;
    if (typeof command !== "string" || !command.trim())
      errors.push(`package.json.scripts.${name} must be a nonempty command.`);
    else if (hasPackagePublicationCommand(command))
      errors.push(`package.json.scripts.${name} must not publish packages or images.`);
  }
  return errors;
}

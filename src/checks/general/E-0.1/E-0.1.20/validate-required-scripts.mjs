import { resolveSelfHostedScriptCommands } from "./resolve-self-hosted-script-commands.mjs";
import { validateCustomScripts } from "./validate-custom-scripts.mjs";

const requiredScripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

export function validateRequiredScripts(
  scripts,
  { requiresPack = false, selfHosted = false } = {},
) {
  if (scripts === null || typeof scripts !== "object" || Array.isArray(scripts)) {
    return "package.json.scripts must be an object.";
  }
  const canonicalScripts = requiresPack
    ? { ...requiredScripts, pack: "eliware-test --pack" }
    : requiredScripts;
  const failures = [];
  // Only the validator package itself may replace consumer-facing commands with its local entrypoint.
  const selfHostedResolution = selfHosted
    ? resolveSelfHostedScriptCommands(Object.keys(canonicalScripts))
    : null;
  if (selfHostedResolution) failures.push(...selfHostedResolution.failures);
  const applicableScripts = selfHostedResolution?.scripts ?? canonicalScripts;
  for (const [name, command] of Object.entries(applicableScripts)) {
    if (
      Object.hasOwn(scripts, name) &&
      (typeof scripts[name] !== "string" || !scripts[name].trim())
    ) {
      failures.push(`package.json.scripts.${name} must be a nonempty command.`);
      continue;
    }
    if (!Object.hasOwn(scripts, name) || scripts[name] !== command)
      failures.push(`package.json.scripts.${name} must be exactly ${command}.`);
  }
  failures.push(...validateCustomScripts(scripts, applicableScripts));
  return failures.length ? failures.join("\n") : null;
}

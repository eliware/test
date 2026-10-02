import { resolveSelfHostedScriptCommands } from "./resolve-self-hosted-script-commands.mjs";
import { isProhibitedPublishCommand } from "../E-0.1.24/is-prohibited-publish-command.mjs";

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
      scripts[name] !== undefined &&
      (typeof scripts[name] !== "string" || !scripts[name].trim())
    ) {
      failures.push(`package.json.scripts.${name} must be a nonempty command.`);
      continue;
    }
    if (scripts?.[name] !== command)
      failures.push(`package.json.scripts.${name} must be exactly ${command}.`);
  }
  for (const [name, command] of Object.entries(scripts)) {
    if (Object.hasOwn(applicableScripts, name)) continue;
    if (typeof command !== "string" || !command.trim()) {
      failures.push(`package.json.scripts.${name} must be a nonempty command.`);
      continue;
    }
    if (isProhibitedPublishCommand(command)) {
      failures.push(`package.json.scripts.${name} must not publish npm packages or GHCR images.`);
    }
  }
  return failures.length ? failures.join("\n") : null;
}

import { isProhibitedNpmOrGhcrPublishCommand } from "../../../shared/is/prohibited-npm-or-ghcr-publish-command.mjs";
import { validateNpmRunCommand } from "../../../shared/package-scripts/validate/npm-run-command.mjs";

const requiredPrefixLength = 3;

export function validateDeploymentCommand(command, label, position, packageJson) {
  const errors = [];
  if (isProhibitedNpmOrGhcrPublishCommand(command))
    errors.push(`${label} must not publish npm packages or GHCR images.`);
  if (position >= requiredPrefixLength)
    errors.push(...validateNpmRunCommand(command, packageJson, `${label} command ${position + 1}`));
  return errors;
}

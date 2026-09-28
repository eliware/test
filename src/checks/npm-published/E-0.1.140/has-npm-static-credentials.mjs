const staticCredentialName =
  /\b(?:NPM_TOKEN|NPM_AUTH_TOKEN|NODE_AUTH_TOKEN|NPM_CONFIG_USERCONFIG)\b|_auth(?:Token)?/iu;
const secretExpression = /\$\{\{\s*secrets\.[^}]+\}\}/iu;

export function hasNpmStaticCredentials(document) {
  if (staticCredentialName.test(JSON.stringify(document))) return true;
  return containsSecretAssignedToAuthSetting(document);
}

function containsSecretAssignedToAuthSetting(value, parentKey = "") {
  if (typeof value === "string") {
    return /auth|token|npm_config_userconfig/iu.test(parentKey) && secretExpression.test(value);
  }
  if (Array.isArray(value))
    return value.some((entry) => containsSecretAssignedToAuthSetting(entry));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, entry]) =>
    containsSecretAssignedToAuthSetting(entry, key),
  );
}

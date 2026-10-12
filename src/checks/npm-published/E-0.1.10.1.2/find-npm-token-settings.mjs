const tokenNames = new Set(["NPM_TOKEN", "NODE_AUTH_TOKEN"]);
const tokenReference =
  /(?:\$\{\{\s*(?:secrets|env)\s*\.\s*(?:NPM_TOKEN|NODE_AUTH_TOKEN)\s*\}\}|\$\{(?:NPM_TOKEN|NODE_AUTH_TOKEN)\}|\$(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b|\$env:(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b|%(?:NPM_TOKEN|NODE_AUTH_TOKEN)%)/u;

export function findNpmTokenSettings(value, path = "publish.yaml") {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && tokenReference.test(value))
      return [`${path} must not reference NPM_TOKEN or NODE_AUTH_TOKEN.`];
    return [];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    tokenNames.has(key)
      ? [`${path} must not define ${key}.`]
      : findNpmTokenSettings(child, `${path}.${key}`),
  );
}

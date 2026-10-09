const tokenNames = new Set(["NPM_TOKEN", "NODE_AUTH_TOKEN"]);

export function findNpmTokenSettings(value, path = "publish.yaml") {
  if (!value || typeof value !== "object") {
    if (
      typeof value === "string" &&
      /\$\{\{\s*secrets\.(?:NPM_TOKEN|NODE_AUTH_TOKEN)\s*\}\}/u.test(value)
    )
      return [`${path} must not reference NPM_TOKEN or NODE_AUTH_TOKEN.`];
    return [];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    tokenNames.has(key)
      ? [`${path} must not define ${key}.`]
      : findNpmTokenSettings(child, `${path}.${key}`),
  );
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function targetsLocalhost(argument) {
  if (argument?.type === "StringLiteral") return isLocalUrl(argument.value);
  if (argument?.type !== "ObjectExpression") return false;
  const values = new Map(
    argument.properties
      .filter((item) => item.type === "ObjectProperty")
      .map((item) => [item.key.name ?? item.key.value, item.value.value]),
  );
  const host = values.get("hostname") ?? values.get("host");
  return typeof host === "string" && isLocalHost(host);
}

export function isInjectedHttpClient(node) {
  const root = rootName(node);
  return (
    typeof root === "string" && /^(?:http|https|httpClient|httpsClient|requestClient)$/iu.test(root)
  );
}

function isLocalUrl(value) {
  try {
    return isLocalHost(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isLocalHost(host) {
  const normalized = host.replace(/^\[|\]$/gu, "");
  if (localHosts.has(normalized)) return true;
  return isLocalUrl(`http://${host}`);
}

function rootName(node) {
  if (node?.type === "Identifier") return node.name;
  if (["MemberExpression", "OptionalMemberExpression"].includes(node?.type))
    return rootName(node.object);
  return undefined;
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
export default function targetsLocalhost(argument) {
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
function isLocalUrl(value) {
  try {
    return isLocalHost(new URL(value).hostname);
  } catch {
    return false;
  }
}
function isLocalHost(host) {
  const normalized = host.replace(/^\[|\]$/gu, "");
  return localHosts.has(normalized);
}

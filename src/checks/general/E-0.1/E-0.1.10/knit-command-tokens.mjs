export function commandTokens(call) {
  if (typeof call.command !== "string" || !Array.isArray(call.args)) return null;
  return [call.command, ...call.args].every((token) => typeof token === "string")
    ? [call.command, ...call.args]
    : null;
}

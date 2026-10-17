export function redactCredentialHeaders(text) {
  return text
    .replace(/((?:x-api-key|x-auth-token|x-access-token)\s*:\s*)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:cookie|set-cookie)\s*:\s*)[^\r\n]+/giu, "$1[REDACTED]");
}

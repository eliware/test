export function redactAuthorizationCredentials(text) {
  return text
    .replace(
      /((?:authorization|proxy-authorization)\s*:\s*(?:bearer|basic)\s+)[^\s,;}]+/giu,
      "$1[REDACTED]",
    )
    .replace(
      /((?:authorization|proxy-authorization)\s*:\s+\[REDACTED\]\s+)[^\s,;}]+/giu,
      "$1[REDACTED]",
    )
    .replace(/((?:bearer|basic)\s+)(?!\[REDACTED\])[^\s,;}]+/giu, "$1[REDACTED]");
}

const credentialKey = "(?:password|passwd|pwd|token|secret|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|client[_-]?id)";

export function redactProcessOutput(text) {
  return String(text)
    .replace(new RegExp(`((?:${credentialKey})\\s*[=:]\\s*)(?:"(?:\\\\.|[^"\\\\])*"|'[^']*'|[^\\s,;}]+)`, "giu"), "$1[REDACTED]")
    .replace(/(authorization\s*:\s*(?:bearer|basic)\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(new RegExp(`((?:${credentialKey})\\s+)(?:"[^"]*"|'[^']*'|[^\\s,;}]+)`, "giu"), "$1[REDACTED]")
    .replace(/((?:bearer|basic)\s+)[A-Za-z0-9+/=_-]{8,}/giu, "$1[REDACTED]")
    .replace(new RegExp(`([?&](?:${credentialKey})=)[^&#\\s]+`, "giu"), "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@:]+(?::[^\s/@]+)?@/giu, "$1[REDACTED]@");
}

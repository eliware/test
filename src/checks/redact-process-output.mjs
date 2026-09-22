const credentialKey = "(?:password|passwd|pwd|token|secret|credential|api[_-]?key|apiKey|access[_-]?key|accessKey|private[_-]?key|privateKey|client[_-]?(?:secret|id)|client(?:Secret|Id)|refresh[_-]?token|refreshToken|session[_-]?id|sessionId)";

export function redactProcessOutput(text) {
  return String(text)
    .replace(/-----BEGIN(?: RSA| OPENSSH| EC)? PRIVATE KEY-----[\s\S]*?-----END(?: RSA| OPENSSH| EC)? PRIVATE KEY-----/gu, "[REDACTED PRIVATE KEY]")
    .replace(new RegExp(`(["']?(?:${credentialKey})["']?\\s*[=:]\\s*)['"][\\s\\S]*?['"]`, "giu"), "$1[REDACTED]")
    .replace(new RegExp(`(["']?(?:${credentialKey})["']?\\s*[=:]\\s*)(?:"(?:\\\\.|[^"\\\\])*"|'[^']*'|[^\\s,;}]+)`, "giu"), "$1[REDACTED]")
    .replace(/((?:authorization|proxy-authorization)\s*:\s*(?:bearer|basic)\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:authorization|proxy-authorization)\s*:\s+\[REDACTED\]\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(new RegExp(`((?:${credentialKey})\\s+)(?:"[^"]*"|'[^']*'|[^\\s,;}]+)`, "giu"), "$1[REDACTED]")
    .replace(/((?:bearer|basic)\s+)[A-Za-z0-9+/=_-]{8,}/giu, "$1[REDACTED]")
    .replace(new RegExp(`([?&](?:${credentialKey})=)[^&#\\s]+`, "giu"), "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@:]+(?::[^\s/@]+)?@/giu, "$1[REDACTED]@")
    .replace(/((?:x-api-key|x-auth-token|x-access-token)\s*:\s*)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|npm_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16})\b)/gu, "[REDACTED]")
    .replace(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/gu, "[REDACTED]")
    ;
}

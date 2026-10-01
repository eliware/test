const credentialKey =
  "(?:password|passwd|pwd|token|secret|credential|api[_-]?key|apiKey|access[_-]?key|accessKey|private[_-]?key|privateKey|client[_-]?(?:secret|id)|client(?:Secret|Id)|refresh[_-]?token|refreshToken|session[_-]?id|sessionId)";

export function redactCredentialFields(text) {
  return String(text)
    .replace(
      /-----BEGIN(?: RSA| OPENSSH| EC)? PRIVATE KEY-----[\s\S]*?-----END(?: RSA| OPENSSH| EC)? PRIVATE KEY-----/gu,
      "[REDACTED PRIVATE KEY]",
    )
    .replace(
      new RegExp(
        String.raw`(["']?(?:${credentialKey})["']?[ \t]*[=:][ \t]*)(?:"(?:\\.|[^"\\\r\n])*"|'[^'\r\n]*'|[^\s,;}]+)`,
        "giu",
      ),
      "$1[REDACTED]",
    )
    .replace(
      new RegExp(
        String.raw`((?:${credentialKey})[ \t]+)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}|]+)`,
        "giu",
      ),
      "$1[REDACTED]",
    );
}

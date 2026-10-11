import { credentialKeyPattern } from "./credential-key-pattern.mjs";

export function redactCredentialFields(text) {
  return String(text)
    .replace(
      /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----[\s\S]*?-----END(?: [A-Z0-9]+)* PRIVATE KEY-----/gu,
      "[REDACTED PRIVATE KEY]",
    )
    .replace(
      /-----BEGIN(?: [A-Z0-9]+)* PUBLIC KEY-----[\s\S]*?-----END(?: [A-Z0-9]+)* PUBLIC KEY-----/gu,
      "[REDACTED PUBLIC KEY]",
    )
    .replace(
      new RegExp(
        String.raw`(["']?(?:${credentialKeyPattern})["']?[ \t]*[=:][ \t]*)(?:"(?:\\.|[^"\\\r\n])*"|'[^'\r\n]*'|[^\s,;}]+)`,
        "giu",
      ),
      "$1[REDACTED]",
    )
    .replace(
      new RegExp(
        String.raw`(["']?(?:${credentialKeyPattern})["']?[ \t]+)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}|]+)`,
        "giu",
      ),
      "$1[REDACTED]",
    );
}

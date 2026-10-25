import { credentialKeyPattern } from "../../credential-key-pattern.mjs";

export function redactCredentialAssignments(text) {
  return String(text)
    .replace(
      new RegExp(
        String.raw`(?<![A-Za-z0-9_-])(["']?(?:${credentialKeyPattern})["']?[ \t]*[=:][ \t]*)(?:"(?:\\[\s\S]|[^"\\])*"|'[^']*'|[^\s,.}]+)`,
        "giu",
      ),
      "$1[REDACTED]",
    )
    .replace(
      new RegExp(
        String.raw`((?:^[ \t]*|[:{,][ \t]*)["']?(?:${credentialKeyPattern})["']?[ \t]+)(?:"(?:\\[\s\S]|[^"\\])*"|'[^']*'|[^\s,.}|]+)`,
        "gimu",
      ),
      "$1[REDACTED]",
    );
}

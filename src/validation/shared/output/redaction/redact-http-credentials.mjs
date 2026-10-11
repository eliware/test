import { credentialKeyPattern } from "./credential-key-pattern.mjs";

export function redactHttpCredentials(text) {
  return (
    String(text)
      .replace(
        /((?:authorization|proxy-authorization)\s*:\s*(?:bearer|basic)\s+)[^\s,;}]+/giu,
        "$1[REDACTED]",
      )
      .replace(
        /((?:authorization|proxy-authorization)\s*:\s+\[REDACTED\]\s+)[^\s,;}]+/giu,
        "$1[REDACTED]",
      )
      // codescope ignore this because bearer and basic tokens can contain punctuation.
      .replace(/((?:bearer|basic)\s+)(?!\[REDACTED\])[^\s,;}]+/giu, "$1[REDACTED]")
      .replace(new RegExp(`([?&](?:${credentialKeyPattern})=)[^&#\\s]+`, "giu"), "$1[REDACTED]")
      .replace(/(https?:\/\/)[^\s/]*@/giu, "$1[REDACTED]@")
      .replace(/((?:x-api-key|x-auth-token|x-access-token)\s*:\s*)[^\s,;}]+/giu, "$1[REDACTED]")
      .replace(/((?:cookie|set-cookie)\s*:\s*)[^\r\n]+/giu, "$1[REDACTED]")
  );
}

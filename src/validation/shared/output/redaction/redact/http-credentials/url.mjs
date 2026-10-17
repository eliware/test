import { credentialKeyPattern } from "../../credential-key-pattern.mjs";

export function redactUrlCredentials(text) {
  return text
    .replace(new RegExp(`([?&](?:${credentialKeyPattern})=)[^&#\\s]+`, "giu"), "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/]*@/giu, "$1[REDACTED]@");
}

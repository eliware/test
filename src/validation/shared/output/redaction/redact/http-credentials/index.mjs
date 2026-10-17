import { redactAuthorizationCredentials } from "./authorization.mjs";
import { redactCredentialHeaders } from "./headers.mjs";
import { redactUrlCredentials } from "./url.mjs";

export function redactHttpCredentials(text) {
  const output = redactAuthorizationCredentials(String(text));
  return redactCredentialHeaders(redactUrlCredentials(output));
}

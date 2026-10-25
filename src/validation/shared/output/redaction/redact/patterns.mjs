import { redactCredentialFields } from "./credential-fields.mjs";
import { redactHttpCredentials } from "./http-credentials/index.mjs";
import { redactKnownTokenFormats } from "./known-token-formats.mjs";
import { redactGenericBase64Credentials } from "./base64-credentials.mjs";

export function redactCredentialPatterns(text) {
  if (text.length < 4) return text;
  return redactGenericBase64Credentials(
    redactKnownTokenFormats(redactHttpCredentials(redactCredentialFields(text))),
  );
}

import { redactCredentialFields } from "../../../../../../shared/output/redaction/redact/credential-fields.mjs";
import { redactHttpCredentials } from "../../../../../../shared/output/redaction/redact/http-credentials/index.mjs";
import { redactKnownTokenFormats } from "../../../../../../shared/output/redaction/redact/known-token-formats.mjs";
import { redactGenericBase64Credentials } from "../../../../../../shared/output/redaction/redact/base64-credentials.mjs";

export function findJestOutputRedactionKinds(output, secrets) {
  const texts = Object.values(output).map((chunks) => chunks.join(""));
  return [
    texts.some((text) => secrets.some((secret) => secret && text.includes(secret)))
      ? "environment secret"
      : null,
    texts.some((text) => redactCredentialFields(text) !== text) ? "credential field" : null,
    texts.some((text) => redactHttpCredentials(text) !== text) ? "HTTP credential" : null,
    texts.some((text) => redactKnownTokenFormats(text) !== text) ? "known token format" : null,
    texts.some((text) => redactGenericBase64Credentials(text) !== text)
      ? "generic Base64 credential"
      : null,
  ].filter(Boolean);
}

export function redactPrivateKeys(text) {
  return String(text)
    .replace(
      /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----[\s\S]*?-----END(?: [A-Z0-9]+)* PRIVATE KEY-----/gu,
      "[REDACTED PRIVATE KEY]",
    )
    .replace(
      /-----BEGIN(?: [A-Z0-9]+)* PUBLIC KEY-----[\s\S]*?-----END(?: [A-Z0-9]+)* PUBLIC KEY-----/gu,
      "[REDACTED PUBLIC KEY]",
    );
}

export function normalizeRedactedPackMetadata(stdout) {
  return stdout.replace(
    /("(?:size|unpackedSize|entryCount|mode)"\s*:\s*)(?:\d|\[REDACTED\])+/gu,
    (_match, property) => `${property}0`,
  );
}

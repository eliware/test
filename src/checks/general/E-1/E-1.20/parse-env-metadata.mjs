const metadataEntry = /\b(default|allowed|range)\s*:\s*(.*?)(?=\s+\b(?:default|allowed|range)\s*:|$)/giu;

export function parseEnvironmentMetadata(comments) {
  return Object.fromEntries(
    [...comments.matchAll(metadataEntry)].map((entry) => [entry[1].toLowerCase(), entry[2].trim()]),
  );
}

const marker = "[REDACTED]";

export function truncateRedactedOutput(text, limit) {
  const boundedLimit = Math.max(0, limit);
  const truncated = text.slice(0, boundedLimit);
  const markerStart = truncated.lastIndexOf(marker[0]);
  if (
    markerStart >= 0 &&
    markerStart + marker.length > boundedLimit &&
    text.startsWith(marker, markerStart)
  ) {
    return truncated.slice(0, markerStart);
  }
  return truncated;
}

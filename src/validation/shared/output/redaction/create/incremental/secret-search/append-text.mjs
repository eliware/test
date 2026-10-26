export function attachAppendTextAdapter(findSafeBoundary, searchAppended) {
  findSafeBoundary.appendText = (text, pendingLength, includePendingMatches = false) =>
    searchAppended(text, pendingLength, includePendingMatches);
  return findSafeBoundary;
}

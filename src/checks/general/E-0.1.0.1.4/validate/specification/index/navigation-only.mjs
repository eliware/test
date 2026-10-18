export function isNavigationOnlyIndex(content) {
  return content
    .split(/\r?\n/u)
    .every(
      (line) =>
        !line.trim() ||
        /^#{1,6}\s/u.test(line) ||
        /^-\s*\[[^\]]+\](?:\([^)]+\)|\[[^\]]*\])\s*$/u.test(line) ||
        /^ {0,3}\[[^\]]+\]:\s*(?:<[^>]+>|\S+)(?:\s+.*)?$/u.test(line),
    );
}

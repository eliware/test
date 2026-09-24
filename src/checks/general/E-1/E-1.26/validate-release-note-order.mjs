function compareVersions(left, right) {
  const leftParts = left.split(".").map(BigInt);
  const rightParts = right.split(".").map(BigInt);
  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
}

export function validateReleaseNoteOrder(entries) {
  const unreleased = entries.filter((entry) => entry.type === "unreleased");
  if (unreleased.length > 1) return "must contain at most one Unreleased section.";
  if (unreleased.length === 1 && entries[0]?.type !== "unreleased") {
    return "must place Unreleased before all versioned entries.";
  }

  const releases = entries.filter((entry) => entry.type === "version");
  for (let index = 1; index < releases.length; index += 1) {
    const newer = releases[index - 1];
    const older = releases[index];
    if (compareVersions(newer.version, older.version) <= 0) {
      return "must list version headings in strictly descending SemVer order.";
    }
    if (newer.date < older.date) {
      return "must list release dates in reverse chronological order.";
    }
  }
  return null;
}

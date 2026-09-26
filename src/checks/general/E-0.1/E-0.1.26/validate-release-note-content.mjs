export function validateReleaseNoteContent(entries, currentVersion) {
  const releases = entries.filter((entry) => entry.type === "version");
  if (releases.length === 0) return "must contain at least one versioned release entry.";
  if (releases[0].version !== currentVersion) {
    return "must place the current package version as the newest release entry.";
  }

  for (const entry of entries) {
    if (entry.categories.length === 0) {
      const heading = entry.type === "unreleased" ? "Unreleased" : entry.version;
      return `must give ${heading} at least one change category.`;
    }
    for (const category of entry.categories) {
      if (!category.content.some(isMeaningfulChangeLine)) {
        return `must give the ${category.name} category user-visible change text.`;
      }
    }
  }
  return null;
}

function isMeaningfulChangeLine(line) {
  return typeof line === "string" && !/^\s{0,3}#{1,6}(?:\s|$)/u.test(line) && /[\p{L}\p{N}]/u.test(line);
}

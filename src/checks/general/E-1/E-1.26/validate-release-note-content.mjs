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
      if (category.content.length === 0) {
        return `must not leave the ${category.name} category empty.`;
      }
    }
  }
  return null;
}

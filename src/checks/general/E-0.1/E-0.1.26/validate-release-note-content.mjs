export function validateReleaseNoteContent(entries, currentVersion) {
  const releases = entries.filter((entry) => entry.type === "version");
  const failures = [];
  if (releases.length === 0) failures.push("must contain at least one versioned release entry.");
  else if (releases[0].version !== currentVersion)
    failures.push("must place the current package version as the newest release entry.");
  for (const entry of entries) {
    if (entry.categories.length === 0) {
      const heading = entry.type === "unreleased" ? "Unreleased" : entry.version;
      failures.push(`must give ${heading} at least one change category.`);
      continue;
    }
    for (const category of entry.categories) {
      if (!category.content.some(isMeaningfulChangeLine)) {
        failures.push(`must give the ${category.name} category user-visible change text.`);
      }
    }
  }
  return failures.length ? failures.join("\n") : null;
}

function isMeaningfulChangeLine(line) {
  return (
    typeof line === "string" &&
    !/^\s{0,3}#{1,6}(?:\s|$)/u.test(line) &&
    !/^\s*(?:tbd|todo|n\/?a|none|no changes?)\s*\.?\s*$/iu.test(line) &&
    /[\p{L}\p{N}]/u.test(line)
  );
}

const categories = new Set([
  "Added",
  "Changed",
  "Fixed",
  "Breaking changes",
  "Migration",
  "Security",
]);
const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;

function isCalendarDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseReleaseNotes(text) {
  const lines = String(text)
    .replace(/^\uFEFF/u, "")
    .split(/\r?\n/u);
  if (lines[0] !== "# Release Notes") {
    return { error: "must begin with the exact heading # Release Notes.", entries: [] };
  }

  const entries = [];
  let currentEntry;
  let currentCategory;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## ")) {
      if (line === "## Unreleased") {
        currentEntry = { type: "unreleased", categories: [] };
      } else {
        const match = versionHeading.exec(line);
        if (!match) {
          return {
            error: `contains a malformed release heading on line ${index + 1}.`,
            entries: [],
          };
        }
        if (!isCalendarDate(match[2])) {
          return { error: `contains an invalid release date on line ${index + 1}.`, entries: [] };
        }
        currentEntry = { type: "version", version: match[1], date: match[2], categories: [] };
      }
      entries.push(currentEntry);
      currentCategory = undefined;
      continue;
    }

    if (line.startsWith("### ")) {
      if (!currentEntry) {
        return {
          error: `contains a category heading outside a release entry on line ${index + 1}.`,
          entries: [],
        };
      }
      const name = line.slice(4);
      if (!categories.has(name)) {
        return {
          error: `contains an unsupported category heading on line ${index + 1}.`,
          entries: [],
        };
      }
      if (currentEntry.categories.some((category) => category.name === name)) {
        return { error: `repeats the ${name} category in one entry.`, entries: [] };
      }
      currentCategory = { name, content: [] };
      currentEntry.categories.push(currentCategory);
      continue;
    }

    if (/^#{1,6}\s/u.test(line) && line.trim()) {
      return { error: `contains an unsupported heading on line ${index + 1}.`, entries: [] };
    }
    if (line.trim()) {
      if (!currentCategory) {
        return {
          error: `contains content outside a change category on line ${index + 1}.`,
          entries: [],
        };
      }
      currentCategory.content.push(line.trim());
    }
  }

  if (entries.length === 0)
    return { error: "must contain at least one versioned release entry.", entries };
  return { error: null, entries };
}

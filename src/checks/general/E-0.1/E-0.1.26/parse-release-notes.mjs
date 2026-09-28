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
  const failures = [];
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
          failures.push(`contains a malformed release heading on line ${index + 1}.`);
          currentEntry = undefined;
          currentCategory = undefined;
          continue;
        }
        if (!isCalendarDate(match[2])) {
          failures.push(`contains an invalid release date on line ${index + 1}.`);
          currentEntry = undefined;
          currentCategory = undefined;
          continue;
        }
        currentEntry = { type: "version", version: match[1], date: match[2], categories: [] };
      }
      entries.push(currentEntry);
      currentCategory = undefined;
      continue;
    }

    if (line.startsWith("### ")) {
      if (!currentEntry) {
        failures.push(`contains a category heading outside a release entry on line ${index + 1}.`);
        currentCategory = undefined;
        continue;
      }
      const name = line.slice(4);
      if (!categories.has(name)) {
        failures.push(`contains an unsupported category heading on line ${index + 1}.`);
        currentCategory = undefined;
        continue;
      }
      if (currentEntry.categories.some((category) => category.name === name)) {
        failures.push(`repeats the ${name} category in one entry.`);
        currentCategory = undefined;
        continue;
      }
      currentCategory = { name, content: [] };
      currentEntry.categories.push(currentCategory);
      continue;
    }

    if (/^#{1,6}\s/u.test(line) && line.trim()) {
      failures.push(`contains an unsupported heading on line ${index + 1}.`);
      currentCategory = undefined;
      continue;
    }
    if (line.trim()) {
      if (!currentCategory) {
        failures.push(`contains content outside a change category on line ${index + 1}.`);
        continue;
      }
      currentCategory.content.push(line.trim());
    }
  }

  if (!entries.some((entry) => entry.type === "version"))
    failures.push("must contain at least one versioned release entry.");
  return { error: failures.length ? failures.join("\n") : null, entries };
}

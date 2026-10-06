const allowedSections = new Set([
  "Added",
  "Changed",
  "Fixed",
  "Breaking changes",
  "Migration",
  "Security",
]);
const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;

export function validateReleaseNotesContent(content) {
  const errors = [];
  const lines = content.split(/\r?\n/u);
  if (lines[0] !== "# Release Notes")
    errors.push("RELEASE_NOTES.md must begin with # Release Notes.");
  if (lines.filter((line) => /^#\s/u.test(line)).length !== 1)
    errors.push("RELEASE_NOTES.md must contain one level-one title.");
  const headings = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^##\s/u.test(line));
  const titles = headings.map(({ line }) => line);
  if (!headings.length)
    errors.push("RELEASE_NOTES.md must contain an Unreleased or versioned entry.");
  if (titles.some((title) => title === "## Unreleased") && titles[0] !== "## Unreleased")
    errors.push("Unreleased must appear before versioned entries.");
  if (titles.filter((title) => title === "## Unreleased").length > 1)
    errors.push("RELEASE_NOTES.md must contain at most one Unreleased section.");
  const unreleased = headings.find(({ line }) => line === "## Unreleased");
  if (unreleased)
    errors.push(...validateEntrySections(lines, unreleased.index, headings, unreleased.line));
  const entries = headings.filter(({ line }) => line !== "## Unreleased");
  const versions = [];
  const dates = [];
  for (const entry of entries) {
    const match = versionHeading.exec(entry.line);
    if (!match) {
      errors.push(`Malformed release entry: ${entry.line}.`);
      continue;
    }
    const [, version, date] = match;
    if (!validDate(date)) errors.push(`Release date is invalid: ${date}.`);
    versions.push(version.split(".").map(Number));
    dates.push(date);
    errors.push(...validateEntrySections(lines, entry.index, headings, entry.line));
  }
  if (new Set(versions.map((version) => version.join("."))).size !== versions.length)
    errors.push("RELEASE_NOTES.md must not duplicate release versions.");
  for (let index = 1; index < versions.length; index++) {
    if (compareVersions(versions[index - 1], versions[index]) <= 0)
      errors.push("Release versions must be in strictly descending SemVer order.");
    if (dates[index - 1] < dates[index]) errors.push("Release dates must not increase.");
  }
  return errors;
}

function validDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateEntrySections(lines, start, headings, title) {
  const next = headings.find(({ index }) => index > start)?.index ?? lines.length;
  const sections = [];
  for (let index = start + 1; index < next; index++)
    if (lines[index].startsWith("### ")) sections.push({ name: lines[index].slice(4), index });
  const errors = [];
  if (!sections.length) return [`${title} must contain a nonempty release subsection.`];
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    const end = sections[index + 1]?.index ?? next;
    if (!allowedSections.has(section.name))
      errors.push(`${title} has an unsupported subsection: ${section.name}.`);
    if (!lines.slice(section.index + 1, end).some((line) => line.trim()))
      errors.push(`${title} subsection ${section.name} must contain text.`);
  }
  return errors;
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index++)
    if (left[index] !== right[index]) return left[index] - right[index];
  return 0;
}

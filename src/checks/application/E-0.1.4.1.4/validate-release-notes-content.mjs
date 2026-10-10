import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { validateReleaseNoteSections } from "./validate-release-note-sections.mjs";

const versionHeading =
  /^## ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)) — (\d{4}-\d{2}-\d{2})$/u;

export function validateReleaseNotesContent(content, packageVersion) {
  const errors = [];
  const normalized = content.replace(/^\uFEFF/u, "");
  const originalLines = normalized.split(/\r?\n/u);
  const lines = removeMarkdownCode(normalized).split(/\r?\n/u);
  if (originalLines[0] !== "# Release Notes")
    errors.push("RELEASE_NOTES.md must begin with # Release Notes.");
  if (lines.filter((line) => /^#\s/u.test(line)).length !== 1)
    errors.push("RELEASE_NOTES.md must contain one level-one title.");
  errors.push(...validateReleaseNoteSections(lines));
  const titles = lines.filter((line) => /^##\s/u.test(line));
  if (!titles.length)
    errors.push("RELEASE_NOTES.md must contain an Unreleased or versioned entry.");
  if (titles.includes("## Unreleased") && titles[0] !== "## Unreleased")
    errors.push("Unreleased must appear before versioned entries.");
  if (titles.filter((title) => title === "## Unreleased").length > 1)
    errors.push("RELEASE_NOTES.md must contain at most one Unreleased section.");
  const entries = titles.filter((title) => title !== "## Unreleased");
  if (!entries.length)
    errors.push("RELEASE_NOTES.md must contain at least one versioned release entry.");
  const newestVersion = versionHeading.exec(entries[0] ?? "")?.[1];
  if (typeof packageVersion !== "string" || !packageVersion)
    errors.push("package.json.version is required for release-note validation.");
  else if (newestVersion && newestVersion !== packageVersion)
    errors.push(
      `Newest release version ${newestVersion} must match package.json.version ${packageVersion}.`,
    );
  errors.push(...validateVersionEntries(entries));
  return errors;
}

function validateVersionEntries(entries) {
  const errors = [];
  const versions = [];
  const dates = [];
  for (const entry of entries) {
    const match = versionHeading.exec(entry);
    if (!match) {
      errors.push(`Malformed release entry: ${entry}.`);
      continue;
    }
    const [, version, date] = match;
    if (!validDate(date)) errors.push(`Release date is invalid: ${date}.`);
    versions.push(version);
    dates.push(date);
  }
  if (new Set(versions).size !== versions.length)
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

function compareVersions(left, right) {
  const leftParts = left.split(".").map(BigInt);
  const rightParts = right.split(".").map(BigInt);
  for (let index = 0; index < leftParts.length; index++)
    if (leftParts[index] !== rightParts[index])
      return leftParts[index] > rightParts[index] ? 1 : -1;
  return 0;
}

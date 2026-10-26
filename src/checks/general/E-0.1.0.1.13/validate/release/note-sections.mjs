import { validateMeaningfulSectionContent } from "./meaningful-section-content.mjs";
import { parseReleaseNoteSections } from "./section-parser.mjs";

const allowedSections = new Set([
  "Added",
  "Changed",
  "Fixed",
  "Breaking changes",
  "Migration",
  "Security",
]);

export function validateReleaseNoteSections(lines) {
  const parsed = parseReleaseNoteSections(lines);
  const errors = [...parsed.errors];
  for (const section of parsed.unscopedSections) {
    errors.push(`${section.heading} must appear inside a release entry.`);
    validateSection(section, "RELEASE_NOTES.md", new Set(), errors);
  }
  for (const entry of parsed.entries) {
    const seen = new Set();
    for (const section of entry.sections) validateSection(section, entry.heading, seen, errors);
    if (!seen.size) errors.push(`${entry.heading} must contain a release subsection.`);
  }
  return errors;
}

function validateSection(section, entry, seen, errors) {
  const { name, content } = section;
  if (!allowedSections.has(name)) {
    errors.push(`${entry} has an unsupported subsection: ${name}.`);
    addOutsideSectionErrors(content, errors);
  } else if (seen.has(name)) {
    errors.push(`${entry} must not repeat the ${name} subsection.`);
    addOutsideSectionErrors(content, errors);
  } else {
    seen.add(name);
    errors.push(...validateMeaningfulSectionContent(entry, name, content));
  }
}

function addOutsideSectionErrors(content, errors) {
  errors.push(
    ...content.map(() => "RELEASE_NOTES.md must not contain text outside a release subsection."),
  );
}

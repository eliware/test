import { isMeaningfulReleaseNoteLine } from "./is-meaningful-release-note-line.mjs";

export function validateMeaningfulSectionContent(entry, section, content) {
  if (content.some(isMeaningfulReleaseNoteLine)) return [];
  return [`${entry} subsection ${section} must contain user-visible change text.`];
}

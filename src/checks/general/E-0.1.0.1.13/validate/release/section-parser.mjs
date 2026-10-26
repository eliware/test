export function parseReleaseNoteSections(lines) {
  const entries = [];
  const unscopedSections = [];
  const errors = [];
  let entry;
  let section;

  for (const line of lines.slice(1)) {
    if (line.startsWith("## ")) {
      entry = { heading: line, sections: [] };
      entries.push(entry);
      section = undefined;
    } else if (line.startsWith("### ")) {
      section = { heading: line, name: line.slice(4), content: [] };
      if (entry) entry.sections.push(section);
      else unscopedSections.push(section);
    } else if (/^#{1,6}\s/u.test(line)) {
      errors.push(`RELEASE_NOTES.md contains an unsupported heading: ${line}.`);
      section = undefined;
    } else if (line.trim()) {
      if (section) section.content.push(line.trim());
      else errors.push("RELEASE_NOTES.md must not contain text outside a release subsection.");
    }
  }

  return { entries, unscopedSections, errors };
}

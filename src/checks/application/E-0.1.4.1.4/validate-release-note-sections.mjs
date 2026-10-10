const allowedSections = new Set([
  "Added",
  "Changed",
  "Fixed",
  "Breaking changes",
  "Migration",
  "Security",
]);

export function validateReleaseNoteSections(lines) {
  const errors = [];
  let entry;
  let section;
  let content = [];
  const seen = new Set();
  for (const line of lines.slice(1)) {
    if (line.startsWith("## ")) {
      finishSection();
      if (entry && !seen.size) errors.push(`${entry} must contain a release subsection.`);
      entry = line;
      section = undefined;
      seen.clear();
    } else if (line.startsWith("### ")) {
      finishSection();
      if (!entry) errors.push(`${line} must appear inside a release entry.`);
      const name = line.slice(4);
      if (!allowedSections.has(name))
        errors.push(`${entry ?? "RELEASE_NOTES.md"} has an unsupported subsection: ${name}.`);
      else if (seen.has(name)) errors.push(`${entry} must not repeat the ${name} subsection.`);
      if (allowedSections.has(name) && !seen.has(name)) {
        seen.add(name);
        section = name;
        content = [];
      } else section = undefined;
    } else if (/^#{1,6}\s/u.test(line)) {
      finishSection();
      errors.push(`RELEASE_NOTES.md contains an unsupported heading: ${line}.`);
      section = undefined;
    } else if (line.trim()) {
      if (!section)
        errors.push("RELEASE_NOTES.md must not contain text outside a release subsection.");
      else content.push(line.trim());
    }
  }
  finishSection();
  if (entry && !seen.size) errors.push(`${entry} must contain a release subsection.`);
  return errors;

  function finishSection() {
    if (section && !content.some(isMeaningfulChangeLine))
      errors.push(`${entry} subsection ${section} must contain user-visible change text.`);
  }
}

function isMeaningfulChangeLine(line) {
  return (
    !/^\s{0,3}#{1,6}(?:\s|$)/u.test(line) &&
    !/^\s*(?:tbd|todo|n\/?a|none|no changes?)\s*\.?\s*$/iu.test(line) &&
    /[\p{L}\p{N}]/u.test(line)
  );
}

import { posix } from "node:path";
import { removeMarkdownCode } from "../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";

export function validateReadmeSpecificationsLink(readme, expected) {
  const lines = removeMarkdownCode(readme).split(/\r?\n/u);
  const sections = readSections(lines);
  const contentHeadings = new Set(expected.slice(1, -3));
  let linkedFromContent = false;
  let linkedFromOtherSection = false;
  for (const section of sections) {
    for (const match of section.body.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      if (!isSpecificationsIndexTarget(match[1])) continue;
      if (contentHeadings.has(section.heading)) linkedFromContent = true;
      else linkedFromOtherSection = true;
    }
  }
  if (linkedFromOtherSection)
    return "README.md must not link specs/README.md from its header, Table of Contents, or footer.";
  return linkedFromContent ? null : "README.md must link specs/README.md from a content section.";
}

export function isSpecificationsIndexTarget(target) {
  const unwrapped = target.replace(/^<|>$/gu, "").split(/[?#]/u, 1)[0];
  return (
    posix.normalize(unwrapped.replaceAll("\\", "/").replace(/^\.\//u, "")) === "specs/README.md"
  );
}

function readSections(lines) {
  const sections = [{ heading: "", body: "" }];
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/u)?.[1]?.trim();
    if (heading) sections.push({ heading, body: "" });
    else sections.at(-1).body += `${line}\n`;
  }
  return sections;
}

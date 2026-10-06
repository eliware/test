import { removeMarkdownCode } from "./extract-markdown-links.mjs";

export function hasMarkdownFragment(content, fragment) {
  let wanted;
  try {
    wanted = decodeURIComponent(fragment);
  } catch {
    return false;
  }
  const anchors = new Set();
  const counts = new Map();
  const lines = removeMarkdownCode(content, { preserveInlineCodeText: true }).split(/\r?\n/u);
  const markupLines = removeMarkdownCode(content).split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = /^(?:#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    const setext = index > 0 && /^ {0,3}(?:=+|-+)\s*$/u.test(line) ? lines[index - 1] : null;
    const title = heading?.[1] ?? setext;
    if (title) {
      const base = slugHeading(title);
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      anchors.add(count ? `${base}-${count}` : base);
    }
    for (const [, doubleQuoted, singleQuoted, unquoted] of markupLines[index].matchAll(
      /\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/giu,
    ))
      anchors.add(doubleQuoted ?? singleQuoted ?? unquoted);
  }
  return anchors.has(wanted);
}

function slugHeading(value) {
  return value
    .replace(/!?\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]+>/gu, "")
    .replace(/[`*_~]/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, "")
    .trim()
    .replace(/\s+/gu, "-");
}

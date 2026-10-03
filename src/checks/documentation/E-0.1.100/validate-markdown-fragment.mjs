import { readRepositoryText } from "../../read-repository-text.mjs";

export function markdownSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export async function hasMarkdownFragment(target, fragment, context, sourceText) {
  if (!fragment || !target.toLowerCase().endsWith(".md")) return true;
  const content = sourceText ?? (await readRepositoryText(context, target));
  let wanted;
  try {
    wanted = decodeURIComponent(fragment).toLowerCase();
  } catch {
    return false;
  }
  return content.split(/\r?\n/u).some((line) => {
    const heading = /^(?:#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    if (heading && markdownSlug(heading[1]) === wanted) return true;
    return [...line.matchAll(/\bid=["']([^"']+)["']/giu)].some(
      ([, id]) => id.toLowerCase() === wanted,
    );
  });
}

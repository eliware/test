import { readRepositoryText } from "../../read-repository-text.mjs";

export function markdownSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export async function hasMarkdownFragment(target, fragment, context) {
  if (!fragment || !target.toLowerCase().endsWith(".md")) return true;
  const content = await readRepositoryText(context, target);
  let wanted;
  try {
    wanted = decodeURIComponent(fragment).toLowerCase();
  } catch {
    return false;
  }
  return content.split(/\r?\n/u).some((line) => {
    const heading = /^(?:#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    const id = /\bid=["']([^"']+)["']/iu.exec(line);
    return (
      (heading && markdownSlug(heading[1]) === wanted) || (id && id[1].toLowerCase() === wanted)
    );
  });
}

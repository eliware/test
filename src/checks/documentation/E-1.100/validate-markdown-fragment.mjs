import { readFile } from "node:fs/promises";

export function markdownSlug(value) {
  return value.toLowerCase().trim().replace(/[`*_~]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "").replace(/\s+/g, "-");
}

export async function hasMarkdownFragment(target, fragment) {
  if (!fragment || !target.toLowerCase().endsWith(".md")) return true;
  const content = await readFile(target, "utf8");
  const wanted = decodeURIComponent(fragment).toLowerCase();
  return content.split(/\r?\n/u).some((line) => {
    const heading = /^(?:#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    const id = /\bid=["']([^"']+)["']/iu.exec(line);
    return (heading && markdownSlug(heading[1]) === wanted) || (id && id[1].toLowerCase() === wanted);
  });
}

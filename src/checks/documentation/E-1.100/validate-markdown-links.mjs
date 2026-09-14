import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { resolveMarkdownLinkTarget } from "./resolve-markdown-link-target.mjs";
import { hasMarkdownFragment } from "./validate-markdown-fragment.mjs";

export async function validateMarkdownLinks(root, files) {
  for (const relativeFile of files.filter((file) => file.endsWith(".md"))) {
    const content = await readFile(join(root, relativeFile), "utf8");
    for (const { reference, referenceLabel } of extractMarkdownLinks(content)) {
      if (referenceLabel || !reference) continue;
      const target = resolveMarkdownLinkTarget(root, relativeFile, reference);
      if (!target) continue;
      const [, fragment] = reference.split("#", 2);
      try {
        await readFile(target);
        if (!(await hasMarkdownFragment(target, fragment))) return `Documentation link fragment does not resolve: ${reference} in ${relativeFile}.`;
      } catch {
        return `Documentation link does not resolve: ${reference} in ${relativeFile}.`;
      }
    }
  }
  return null;
}

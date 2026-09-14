import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { resolveMarkdownLinkTarget } from "./resolve-markdown-link-target.mjs";
import { hasMarkdownFragment } from "./validate-markdown-fragment.mjs";

function validateExternalReference(reference) {
  if (/^mailto:/iu.test(reference)) return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/iu.test(reference) ? null : `Documentation link is invalid: ${reference}.`;
  try {
    const url = new URL(reference);
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? null : `Documentation link is invalid: ${reference}.`;
  } catch {
    return `Documentation link is invalid: ${reference}.`;
  }
}

export async function validateMarkdownLinks(root, files) {
  for (const relativeFile of files.filter((file) => file.endsWith(".md"))) {
    const content = await readFile(join(root, relativeFile), "utf8");
    for (const { reference, referenceLabel } of extractMarkdownLinks(content)) {
      if (!reference) {
        return `Documentation link reference is undefined: ${referenceLabel} in ${relativeFile}.`;
      }
      if (/^[a-z][a-z\d+.-]*:/iu.test(reference)) {
        const externalError = validateExternalReference(reference);
        if (externalError) return externalError;
        continue;
      }
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

import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { resolveMarkdownLinkTarget } from "./resolve-markdown-link-target.mjs";
import { parseMarkdownLinkReference } from "./parse-markdown-link-reference.mjs";
import { hasMarkdownFragment } from "./validate-markdown-fragment.mjs";
import { validateExternalDocumentationLink } from "./validate-external-documentation-link.mjs";

export async function validateMarkdownLinks(root, files, context, inspectTarget = stat) {
  const failures = [];
  const targetInfoCache = new Map();
  const markdownContentCache = new Map();
  const fragmentCache = new Map();
  for (const relativeFile of files.filter((file) => file.endsWith(".md"))) {
    let content;
    try {
      content = await readRepositoryText(context, join(root, relativeFile));
    } catch (error) {
      failures.push(`${relativeFile}: ${error.message}`);
      continue;
    }
    for (const { reference, referenceLabel } of extractMarkdownLinks(content)) {
      if (!reference) {
        failures.push(
          `Documentation link reference is undefined: ${referenceLabel} in ${relativeFile}.`,
        );
        continue;
      }
      if (/^[a-z][a-z\d+.-]*:/iu.test(reference)) {
        const externalError = validateExternalDocumentationLink(reference);
        if (externalError) failures.push(`${externalError} in ${relativeFile}.`);
        continue;
      }
      if (reference.startsWith("//")) {
        failures.push(`Documentation link is invalid: ${reference} in ${relativeFile}.`);
        continue;
      }
      const { path: pathReference, fragment } = parseMarkdownLinkReference(reference);
      const target = resolveMarkdownLinkTarget(root, relativeFile, pathReference);
      if (!target) {
        failures.push(
          `Documentation link escapes the repository: ${reference} in ${relativeFile}.`,
        );
        continue;
      }
      try {
        const targetInfo = await cachedValue(targetInfoCache, target, () => inspectTarget(target));
        if (targetInfo.isDirectory()) continue;
        let markdownContent;
        if (target.toLowerCase().endsWith(".md"))
          markdownContent = await cachedValue(markdownContentCache, target, () =>
            readRepositoryText(context, target),
          );
        else if (context?.repositoryInventory?.readBytes)
          await context.repositoryInventory.readBytes(target);
        else await readFile(target);
        const fragmentExists = await cachedValue(fragmentCache, `${target}\0${fragment}`, () =>
          hasMarkdownFragment(target, fragment, context, markdownContent),
        );
        if (!fragmentExists)
          failures.push(
            `Documentation link fragment does not resolve: ${reference} in ${relativeFile}.`,
          );
      } catch {
        failures.push(`Documentation link does not resolve: ${reference} in ${relativeFile}.`);
      }
    }
  }
  return failures.length ? failures.join("\n") : null;
}

function cachedValue(cache, key, load) {
  if (!cache.has(key)) cache.set(key, Promise.resolve().then(load));
  return cache.get(key);
}

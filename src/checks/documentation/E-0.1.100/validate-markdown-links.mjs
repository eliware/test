import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { resolveMarkdownLinkTarget } from "./resolve-markdown-link-target.mjs";
import { parseMarkdownLinkReference } from "./parse-markdown-link-reference.mjs";
import { hasMarkdownFragment } from "./validate-markdown-fragment.mjs";
import { validateExternalDocumentationLink } from "./validate-external-documentation-link.mjs";

export async function validateMarkdownLinks(root, files, context) {
  const failures = [];
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
        const targetInfo = await stat(target);
        if (targetInfo.isDirectory()) continue;
        if (target.toLowerCase().endsWith(".md")) await readRepositoryText(context, target);
        else if (context?.repositoryInventory?.readBytes)
          await context.repositoryInventory.readBytes(target);
        else await readFile(target);
        if (!(await hasMarkdownFragment(target, fragment, context)))
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

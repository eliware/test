import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { resolveMarkdownLinkTarget } from "./resolve-markdown-link-target.mjs";
import { hasMarkdownFragment } from "./validate-markdown-fragment.mjs";
import { validateExternalDocumentationLink } from "./validate-external-documentation-link.mjs";

export async function validateMarkdownLinks(root, files, context) {
  for (const relativeFile of files.filter((file) => file.endsWith(".md"))) {
    const content = await readRepositoryText(context, join(root, relativeFile));
    for (const { reference, referenceLabel } of extractMarkdownLinks(content)) {
      if (!reference) {
        return `Documentation link reference is undefined: ${referenceLabel} in ${relativeFile}.`;
      }
      if (/^[a-z][a-z\d+.-]*:/iu.test(reference)) {
        const externalError = validateExternalDocumentationLink(reference);
        if (externalError) return externalError;
        continue;
      }
      const target = resolveMarkdownLinkTarget(root, relativeFile, reference);
      if (!target) {
        return `Documentation link escapes the repository: ${reference} in ${relativeFile}.`;
      }
      const [, fragment] = reference.split("#", 2);
      try {
        if (target.toLowerCase().endsWith(".md")) await readRepositoryText(context, target);
        else if (context?.repositoryInventory?.readBytes)
          await context.repositoryInventory.readBytes(target);
        else await readFile(target);
        if (!(await hasMarkdownFragment(target, fragment, context))) return `Documentation link fragment does not resolve: ${reference} in ${relativeFile}.`;
      } catch {
        return `Documentation link does not resolve: ${reference} in ${relativeFile}.`;
      }
    }
  }
  return null;
}

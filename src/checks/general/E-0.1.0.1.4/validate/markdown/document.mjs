import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { extractMarkdownAssets } from "../../extract-markdown/assets.mjs";
import { extractMarkdownLinks } from "../../extract-markdown/links.mjs";
import { validateExternalLink } from "../external-markdown-link.mjs";

export async function validateMarkdownDocument(root, file, validateLocal, read = readFile) {
  let text;
  try {
    text = await read(join(root, file), "utf8");
  } catch (error) {
    return [`${file} could not be read: ${error.message}`];
  }
  const errors = [];
  for (const { reference } of [...extractMarkdownLinks(text), ...extractMarkdownAssets(text)]) {
    if (!reference) {
      errors.push(`Markdown reference link has no definition in ${file}.`);
      continue;
    }
    if (/^(?:https?|mailto):/iu.test(reference) || reference.startsWith("//")) {
      const error = validateExternalLink(reference);
      if (error) errors.push(`${error} in ${file}.`);
      continue;
    }
    const error = await validateLocal(file, reference);
    if (error) errors.push(error);
  }
  return errors;
}

import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { findMarkdownFiles } from "./find-markdown-files.mjs";
import { hasMarkdownFragment } from "./resolve-markdown-fragment.mjs";
import { validateExternalLink } from "./validate-external-markdown-link.mjs";

export async function validateMarkdownLinks(root, context = {}, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const inspect = dependencies.stat ?? stat;
  const resolveRealpath = dependencies.realpath ?? realpath;
  let files;
  try {
    files = await (context.repositoryInventory?.documentationFiles?.({
      directory: root,
      predicate: (name) => name.toLowerCase().endsWith(".md"),
    }) ?? findMarkdownFiles(root));
  } catch (error) {
    return [`Markdown files could not be listed: ${error.message}`];
  }
  const errors = [];
  let realRoot;
  for (const file of files) {
    let text;
    try {
      text = await read(join(root, file), "utf8");
    } catch (error) {
      errors.push(`${file} could not be read: ${error.message}`);
      continue;
    }
    for (const { reference } of extractMarkdownLinks(text)) {
      if (!reference) {
        errors.push(`Markdown reference link has no definition in ${file}.`);
        continue;
      }
      if (/^(?:https?|mailto):/iu.test(reference)) {
        const error = validateExternalLink(reference);
        if (error) errors.push(`${error} in ${file}.`);
        continue;
      }
      if (reference.startsWith("//")) {
        errors.push(`Documentation link is invalid: ${reference} in ${file}.`);
        continue;
      }
      const [pathname, fragment] = splitReference(reference);
      const target = resolve(dirname(join(root, file)), pathname || file);
      const relativeTarget = relative(root, target).split(sep).join("/");
      if (
        relativeTarget === ".." ||
        relativeTarget.startsWith("../") ||
        /^[A-Za-z]:\//u.test(relativeTarget)
      ) {
        errors.push(`Documentation link escapes the repository: ${reference} in ${file}.`);
        continue;
      }
      try {
        realRoot ??= await resolveRealpath(root);
        const realTarget = await resolveRealpath(target);
        const realRelative = relative(realRoot, realTarget);
        if (escapesRoot(realRelative)) {
          errors.push(`Documentation link escapes the repository: ${reference} in ${file}.`);
          continue;
        }
        const info = await inspect(target);
        if (fragment && target.toLowerCase().endsWith(".md")) {
          const targetText = await read(target, "utf8");
          if (!hasMarkdownFragment(targetText, fragment))
            errors.push(`Documentation fragment does not resolve: ${reference} in ${file}.`);
        } else if (!info.isFile() && !info.isDirectory()) {
          errors.push(`Documentation link does not resolve: ${reference} in ${file}.`);
        }
      } catch {
        errors.push(`Documentation link does not resolve: ${reference} in ${file}.`);
      }
    }
  }
  return errors;
}

function escapesRoot(path) {
  return path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path);
}

function splitReference(value) {
  const [path, ...fragment] = value.split("#");
  return [path.split("?")[0], fragment.join("#")];
}

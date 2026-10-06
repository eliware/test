import { readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { findMarkdownFiles } from "./find-markdown-files.mjs";

export async function validateMarkdownLinks(root, context = {}, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const inspect = dependencies.stat ?? stat;
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
  for (const file of files) {
    let text;
    try {
      text = await read(join(root, file), "utf8");
    } catch (error) {
      errors.push(`${file} could not be read: ${error.message}`);
      continue;
    }
    for (const { reference } of extractMarkdownLinks(text)) {
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
        const info = await inspect(target);
        if (fragment && target.toLowerCase().endsWith(".md")) {
          const targetText = await read(target, "utf8");
          if (!hasFragment(targetText, fragment))
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

function validateExternalLink(value) {
  if (/^mailto:/iu.test(value))
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/iu.test(value)
      ? null
      : `Documentation link is invalid: ${value}.`;
  try {
    const url = new URL(value);
    const github =
      url.hostname.toLowerCase() === "github.com" && /^\/[^/]+\/[^/]+(?:\/|$)/u.test(url.pathname);
    return ["http:", "https:"].includes(url.protocol) &&
      (!github || url.protocol === "https:") &&
      !url.username &&
      !url.password
      ? null
      : `Documentation link is invalid: ${value}.`;
  } catch {
    return `Documentation link is invalid: ${value}.`;
  }
}

function splitReference(value) {
  const [path, ...fragment] = value.split("#");
  return [path.split("?")[0], fragment.join("#")];
}

function hasFragment(content, fragment) {
  let wanted;
  try {
    wanted = decodeURIComponent(fragment).toLowerCase();
  } catch {
    return false;
  }
  return content.split(/\r?\n/u).some((line) => {
    const heading = /^(?:#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    const slug = heading?.[1]
      .toLowerCase()
      .replace(/[`*_~]/gu, "")
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .trim()
      .replace(/\s+/gu, "-");
    return (
      slug === wanted ||
      [...line.matchAll(/\bid=["']([^"']+)["']/giu)].some(([, id]) => id.toLowerCase() === wanted)
    );
  });
}

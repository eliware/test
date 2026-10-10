import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { hasMarkdownFragment } from "./resolve-markdown-fragment.mjs";

export function createLocalMarkdownReferenceValidator(root, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const inspect = dependencies.stat ?? stat;
  const resolveRealpath = dependencies.realpath ?? realpath;
  let realRoot;
  return async (file, reference) => {
    const [pathname, fragment] = splitReference(reference);
    const target = resolve(dirname(join(root, file)), pathname || file);
    const relativeTarget = relative(root, target).split(sep).join("/");
    if (escapesRoot(relativeTarget))
      return `Documentation link escapes the repository: ${reference} in ${file}.`;
    try {
      realRoot ??= await resolveRealpath(root);
      const realTarget = await resolveRealpath(target);
      if (escapesRoot(relative(realRoot, realTarget)))
        return `Documentation link escapes the repository: ${reference} in ${file}.`;
      const info = await inspect(target);
      if (fragment && target.toLowerCase().endsWith(".md")) {
        const targetText = await read(target, "utf8");
        if (!hasMarkdownFragment(targetText, fragment))
          return `Documentation fragment does not resolve: ${reference} in ${file}.`;
      } else if (!info.isFile() && !info.isDirectory()) {
        return `Documentation link does not resolve: ${reference} in ${file}.`;
      }
    } catch {
      return `Documentation link does not resolve: ${reference} in ${file}.`;
    }
    return null;
  };
}

function escapesRoot(path) {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized === ".." ||
    normalized.startsWith("../") ||
    /^[A-Za-z]:\//u.test(normalized) ||
    isAbsolute(path)
  );
}

function splitReference(value) {
  const [path, ...fragment] = value.split("#");
  return [path.split("?")[0], fragment.join("#")];
}

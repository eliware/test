import { readFile, realpath, stat } from "node:fs/promises";
import isPathOutsideRoot from "./resolve/local-reference/is-path-outside-root.mjs";
import resolveLocalMarkdownReference from "./resolve/local-reference.mjs";
import hasMarkdownFragmentTarget from "./resolve/markdown-fragment-target.mjs";
export default function createLocalMarkdownReferenceValidator(root, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const inspect = dependencies.stat ?? stat;
  const resolveRealpath = dependencies.realpath ?? realpath;
  let realRoot;
  return async (file, reference) => {
    const localReference = resolveLocalMarkdownReference(root, file, reference);
    const { target, fragment } = localReference;
    if (localReference.escapesRoot)
      return `Documentation link escapes the repository: ${reference} in ${file}.`;
    try {
      realRoot ??= await resolveRealpath(root);
      const realTarget = await resolveRealpath(target);
      if (isPathOutsideRoot(realRoot, realTarget))
        return `Documentation link escapes the repository: ${reference} in ${file}.`;
      const info = await inspect(target);
      if (fragment && target.toLowerCase().endsWith(".md")) {
        if (!(await hasMarkdownFragmentTarget(read, target, fragment)))
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

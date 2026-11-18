import { realpath } from "node:fs/promises";
import resolveLocalMarkdownReference from "./resolve/local-reference.mjs";
import validateMarkdownLocalTarget from "./resolve/local-reference/validate-target.mjs";
export default function createLocalMarkdownReferenceValidator(root, dependencies = {}) {
  const resolveRealpath = dependencies.realpath ?? realpath;
  let realRoot;
  return async (file, reference) => {
    const localReference = resolveLocalMarkdownReference(root, file, reference);
    const { target, fragment } = localReference;
    if (localReference.escapesRoot)
      return `Documentation link escapes the repository: ${reference} in ${file}.`;
    try {
      realRoot ??= await resolveRealpath(root);
      const result = await validateMarkdownLocalTarget(realRoot, target, fragment, dependencies);
      if (result === "outside")
        return `Documentation link escapes the repository: ${reference} in ${file}.`;
      if (result === "fragment")
        return `Documentation fragment does not resolve: ${reference} in ${file}.`;
      if (result === "missing")
        return `Documentation link does not resolve: ${reference} in ${file}.`;
    } catch {
      return `Documentation link does not resolve: ${reference} in ${file}.`;
    }
    return null;
  };
}

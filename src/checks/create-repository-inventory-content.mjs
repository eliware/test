import { createRepositoryAstCache } from "./create-repository-ast-cache.mjs";
import { createRepositoryFileContentCache } from "./create-repository-file-content-cache.mjs";
import { createRepositoryParsedContentCache } from "./create-repository-parsed-content-cache.mjs";

export function createRepositoryContentCache(root, read, parseSource) {
  const content = createRepositoryFileContentCache(root, read);

  return {
    ...content,
    readParsed: createRepositoryParsedContentCache(root, content.readText),
    parseAst: createRepositoryAstCache({ read: content.readText, ...(parseSource ? { parseSource } : {}) }),
  };
}

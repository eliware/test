import { resolve } from "node:path";
import { uncacheableParserOptions } from "../canonicalize-parser-options.mjs";
import canonicalizeParserOptions from "../canonicalize-parser-options.mjs";
export default function createRepositoryAstCacheKey(root, repositoryFile, options) {
  const canonicalOptions = canonicalizeParserOptions(options);
  if (canonicalOptions === uncacheableParserOptions) return null;
  return JSON.stringify([resolve(root), repositoryFile, canonicalOptions]);
}

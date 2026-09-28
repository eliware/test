import { resolve } from "node:path";
import {
  canonicalizeParserOptions,
  uncacheableParserOptions,
} from "./canonicalize-parser-options.mjs";

export function createRepositoryAstCacheKey(root, repositoryFile, options) {
  const canonicalOptions = canonicalizeParserOptions(options);
  if (canonicalOptions === uncacheableParserOptions) return null;
  return JSON.stringify([resolve(root), repositoryFile, canonicalOptions]);
}

import { isDeepStrictEqual } from "node:util";

export const canonicalPrettierConfiguration = Object.freeze({
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  proseWrap: "preserve",
  endOfLine: "lf",
});

export function validatePrettierConfiguration(packageJson = {}) {
  if (!isDeepStrictEqual(packageJson?.prettier, canonicalPrettierConfiguration))
    return ["package.json.prettier must match the canonical Eliware configuration exactly."];
  return [];
}

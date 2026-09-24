import { fail, pass } from "../../../check-result.mjs";
import { isDeepStrictEqual } from "node:util";

export const ruleId = "A-1.20.18";
export const parentRuleId = "E-1.20";

export function run({ packageJson }) {
  const prettier = packageJson?.prettier;
  const required = {
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
  };
  if (
    !prettier ||
    typeof prettier !== "object" ||
    Array.isArray(prettier) ||
    !isDeepStrictEqual(prettier, required)
  ) {
    return fail(ruleId, "package.json must contain the canonical Eliware Prettier configuration.");
  }
  return pass(ruleId);
}

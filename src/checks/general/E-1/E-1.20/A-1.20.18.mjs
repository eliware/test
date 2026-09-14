import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.20.18";
export const parentRuleId = "E-1.20";

export function run({ packageJson }) {
  const prettier = packageJson?.prettier;
  const required = {
    printWidth: 100,
    tabWidth: 2,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
  };
  if (
    !prettier ||
    typeof prettier !== "object" ||
    Object.entries(required).some(([key, value]) => prettier[key] !== value)
  ) {
    return fail(ruleId, "package.json must contain the canonical Eliware Prettier configuration.");
  }
  return pass(ruleId);
}

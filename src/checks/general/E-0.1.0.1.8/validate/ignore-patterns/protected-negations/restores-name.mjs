import { isUniversalIgnoreRule } from "../is-universal-ignore-rule.mjs";

export function restoresProtectedName(rules, index, name) {
  return index > rules.findIndex((rule) => isUniversalIgnoreRule(rule, name));
}

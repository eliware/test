import { findProtectedNegationMatches } from "./protected-negations/matched-names.mjs";
import { restoresProtectedName } from "./protected-negations/restores-name.mjs";

export function findProtectedNegations(rules) {
  const restorations = [];
  rules.forEach((rule, index) => {
    if (!rule.startsWith("!")) return;
    const pattern = rule.slice(1).replace(/^\//u, "").replace(/\/$/u, "");
    if (!pattern) return;
    const matchedNames = findProtectedNegationMatches(rule);
    if (matchedNames.some((name) => restoresProtectedName(rules, index, name)))
      restorations.push(rule);
  });
  return restorations;
}

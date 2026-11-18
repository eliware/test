import findProtectedNegations from "./protected-negations.mjs";
export default function validateProtectedIgnoreNegations(rules) {
  const restorations = findProtectedNegations(rules);
  return restorations.length
    ? `.gitignore must not restore protected paths with negation rules: ${restorations.join(", ")}.`
    : null;
}

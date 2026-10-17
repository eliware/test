import {
  findProtectedNegations,
  isUniversalIgnoreRule,
} from "./ignore-patterns/protected-negations.mjs";

const ignoredDirectories = [
  "node_modules",
  ".git",
  "coverage",
  "dist",
  "build",
  "generated",
  "artifacts",
  "test-results",
];
const nestedRoots = ["nested", "nested/deep", "nested/deep/layer", "nested/deep/layer/four"];

export const requiredIgnoreCases = [
  ["package.json", false],
  ...nestedRoots.flatMap((root) =>
    ignoredDirectories.map((directory) => [`${root}/${directory}/item.txt`, true]),
  ),
  ["nested/.DS_Store", true],
  ["nested/Thumbs.db", true],
];

export function validateRequiredIgnoreRules(content) {
  const rules = content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const requiredDirectories = ignoredDirectories.filter((name) => name !== ".git");
  const missing = requiredDirectories.filter(
    (name) => !rules.some((rule) => isUniversalIgnoreRule(rule, name)),
  );
  if (!rules.some((rule) => isUniversalIgnoreRule(rule, ".git"))) missing.push(".git");
  for (const name of [".DS_Store", "Thumbs.db"])
    if (!rules.some((rule) => isUniversalIgnoreRule(rule, name))) missing.push(name);
  const errors = missing.length
    ? [`.gitignore must define universal rules for: ${missing.join(", ")}.`]
    : [];
  const restorations = findProtectedNegations(rules);
  if (restorations.length)
    errors.push(
      `.gitignore must not restore protected paths with negation rules: ${restorations.join(", ")}.`,
    );
  return errors;
}

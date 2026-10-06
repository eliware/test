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
  ...nestedRoots.flatMap((root) =>
    ignoredDirectories.map((directory) => [`${root}/${directory}/item.txt`, true]),
  ),
  ...nestedRoots.flatMap((root) => [
    [`${root}/.env`, true],
    [`${root}/.envrc`, true],
    [`${root}/.envsecret`, true],
    [`${root}/.env.production`, true],
    [`${root}/.env.local`, true],
    [`${root}/.env.production.example`, false],
  ]),
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
    (name) => !rules.some((rule) => isUniversalRule(rule, name)),
  );
  if (!rules.some((rule) => isUniversalRule(rule, ".git"))) missing.push(".git");
  for (const name of [".DS_Store", "Thumbs.db"])
    if (!rules.some((rule) => isUniversalRule(rule, name))) missing.push(name);
  if (!rules.includes(".env*")) missing.push(".env*");
  if (!rules.includes("!.env*.example")) missing.push("!.env*.example");
  const unsafeNegations = rules.filter((rule) => rule.startsWith("!") && rule !== "!.env*.example");
  if (unsafeNegations.length) missing.push(`unsafe negations: ${unsafeNegations.join(", ")}`);
  return missing.length
    ? [`.gitignore must define universal rules for: ${missing.join(", ")}.`]
    : [];
}

function isUniversalRule(rule, name) {
  if (rule.startsWith("!")) return false;
  const pattern = rule.replace(/\/$/u, "");
  return pattern === name || pattern === `**/${name}`;
}

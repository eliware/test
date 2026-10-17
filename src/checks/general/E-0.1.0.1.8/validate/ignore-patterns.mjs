import { minimatch } from "minimatch";

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
    (name) => !rules.some((rule) => isUniversalRule(rule, name)),
  );
  if (!rules.some((rule) => isUniversalRule(rule, ".git"))) missing.push(".git");
  for (const name of [".DS_Store", "Thumbs.db"])
    if (!rules.some((rule) => isUniversalRule(rule, name))) missing.push(name);
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

function findProtectedNegations(rules) {
  const protectedDirectories = [...ignoredDirectories, ".git"];
  const protectedFiles = [".DS_Store", "Thumbs.db"];
  const restorations = [];
  rules.forEach((rule, index) => {
    if (!rule.startsWith("!")) return;
    const pattern = rule.slice(1).replace(/^\//u, "").replace(/\/$/u, "");
    if (!pattern) return;
    const segments = pattern.split("/");
    const matchedDirectories = protectedDirectories.filter((name) =>
      segments.some(
        (segment, segmentIndex) =>
          minimatch(name, segment, { dot: true }) &&
          segments.slice(segmentIndex + 1).every((tail) => tail === "**"),
      ),
    );
    const matchedFiles = protectedFiles.filter((name) =>
      segments.some(
        (segment, segmentIndex) =>
          segmentIndex === segments.length - 1 && minimatch(name, segment, { dot: true }),
      ),
    );
    const matchedNames = [...matchedDirectories, ...matchedFiles];
    if (matchedNames.some((name) => index > rules.findIndex((item) => isUniversalRule(item, name))))
      restorations.push(rule);
  });
  return restorations;
}

function isUniversalRule(rule, name) {
  if (rule.startsWith("!")) return false;
  const pattern = rule.replace(/\/$/u, "");
  return pattern === name || pattern === `**/${name}` || pattern === `**/${name}/**`;
}

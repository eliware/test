import { minimatch } from "minimatch";

const protectedDirectories = [
  "node_modules",
  ".git",
  "coverage",
  "dist",
  "build",
  "generated",
  "artifacts",
  "test-results",
];
const protectedFiles = [".DS_Store", "Thumbs.db"];

export function findProtectedNegations(rules) {
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
    if (
      matchedNames.some(
        (name) => index > rules.findIndex((item) => isUniversalIgnoreRule(item, name)),
      )
    )
      restorations.push(rule);
  });
  return restorations;
}

export function isUniversalIgnoreRule(rule, name) {
  if (rule.startsWith("!")) return false;
  const pattern = rule.replace(/\/$/u, "");
  return pattern === name || pattern === `**/${name}` || pattern === `**/${name}/**`;
}
